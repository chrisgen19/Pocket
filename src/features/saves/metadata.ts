import { extractDomain } from './utils';

export type LinkMetadata = {
  url: string;
  title: string;
  domain: string;
  excerpt: string;
  imageUrl: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function pickMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    // Match property/name in either order; both single and double quotes.
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
        'i',
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return decodeEntities(m[1]).trim();
    }
  }
  return null;
}

function pickTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1] ? decodeEntities(m[1]).trim() : null;
}

function resolveUrl(maybeRelative: string, base: string): string {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return maybeRelative;
  }
}

export async function fetchLinkMetadata(target: string): Promise<LinkMetadata> {
  const domain = extractDomain(target);
  const fallback: LinkMetadata = {
    url: target,
    title: `Saved from ${domain}`,
    domain,
    excerpt: '',
    imageUrl: '',
  };

  try {
    const res = await fetch(target, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PocketBot/0.1; +https://github.com/chrisgen19/Pocket)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return fallback;
    const html = (await res.text()).slice(0, 250_000);

    const title =
      pickMeta(html, ['og:title', 'twitter:title']) ?? pickTitle(html) ?? fallback.title;
    const excerpt =
      pickMeta(html, ['og:description', 'twitter:description', 'description']) ?? '';
    const rawImage = pickMeta(html, ['og:image', 'twitter:image']) ?? '';

    return {
      url: target,
      title,
      domain,
      excerpt,
      imageUrl: rawImage ? resolveUrl(rawImage, target) : '',
    };
  } catch {
    return fallback;
  }
}

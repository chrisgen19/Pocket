import { fetch as undiciFetch } from 'undici';
import { safeDispatcher } from '@/lib/safe-fetch';
import { assertSafeUrl, UnsafeUrlError } from '@/lib/url-safety';
import { extractDomain } from './utils';

export { UnsafeUrlError };

export type LinkMetadata = {
  url: string;
  title: string;
  domain: string;
  excerpt: string;
  imageUrl: string;
};

const MAX_BYTES = 256 * 1024;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8000;
const USER_AGENT = 'Mozilla/5.0 (compatible; PocketBot/0.1; +https://github.com/chrisgen19/Pocket)';

// WordPress.com mShots: free, no API key, no watermark. Used as the last-resort
// thumbnail when the page exposes no og:image / twitter:image / body image.
// First request for a new URL may return a placeholder for ~30s while their
// service generates the real screenshot; subsequent loads serve the cached image.
function buildScreenshotUrl(target: string): string {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(target)}?w=600`;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function pickMeta(html: string, names: string[]): string | null {
  for (const name of names) {
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
  // Some sites use unencoded spaces in og:image paths. Encode the path
  // portion only so new URL() can parse it, then return the normalised href.
  const encoded = maybeRelative.replace(/[^\x21-\x7E]|[ <>{}|\\^`]/g, (c) =>
    encodeURIComponent(c),
  );
  try {
    return new URL(encoded, base).href;
  } catch {
    return encoded;
  }
}

const SKIP_IMAGE_RE = /logo|icon|avatar|sprite|banner|badge|pixel|spacer|tracking|button/i;
// Meta descriptions shorter than this are likely site-wide taglines.
const SHORT_DESCRIPTION_THRESHOLD = 80;
const EXCERPT_MAX_LENGTH = 280;

// Pull the first substantive paragraph from <article>/<main> (falls back to
// <body>). Used when the meta description is missing or a generic site tagline.
function pickFirstBodyParagraph(html: string): string | null {
  const scope =
    html.match(/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)>/i)?.[0] ??
    html.match(/<body[\s\S]*$/i)?.[0] ??
    html;

  const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRe.exec(scope)) !== null) {
    const text = decodeEntities(
      match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    );
    if (text.length >= 40) {
      return text.length > EXCERPT_MAX_LENGTH
        ? `${text.slice(0, EXCERPT_MAX_LENGTH).trimEnd()}…`
        : text;
    }
  }
  return null;
}

// Extract the first content <img> from the page.
// Prefers images inside <article> or <main>; falls back to full <body>.
// Skips data URIs, tiny images (explicit w/h <= 50px), and common chrome assets.
function pickFirstBodyImage(html: string, baseUrl: string): string | null {
  const contentMatch =
    html.match(/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)>/i);
  const scope = contentMatch ? contentMatch[0] : (html.match(/<body[\s\S]*$/i)?.[0] ?? html);

  const imgRe = /<img\s[^>]+>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRe.exec(scope)) !== null) {
    const tag = match[0];
    const src = tag.match(/\ssrc=["']([^"']+)["']/i)?.[1];
    if (!src || src.startsWith('data:')) continue;

    const w = Number(tag.match(/\swidth=["']?(\d+)/i)?.[1] ?? 0);
    const h = Number(tag.match(/\sheight=["']?(\d+)/i)?.[1] ?? 0);
    if ((w && w <= 50) || (h && h <= 50)) continue;

    const cls = tag.match(/\sclass=["']([^"']*)["']/i)?.[1] ?? '';
    const id = tag.match(/\sid=["']([^"']*)["']/i)?.[1] ?? '';
    if (SKIP_IMAGE_RE.test(src) || SKIP_IMAGE_RE.test(cls) || SKIP_IMAGE_RE.test(id)) continue;

    return resolveUrl(src, baseUrl);
  }
  return null;
}

type StreamingResponse = {
  body: { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }>; cancel(): Promise<void> } } | null;
};

async function readCapped(res: StreamingResponse, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    const remaining = max - total;
    if (value.byteLength <= remaining) {
      chunks.push(value);
      total += value.byteLength;
    } else {
      if (remaining > 0) chunks.push(value.subarray(0, remaining));
      total = max;
      await reader.cancel().catch(() => {});
      break;
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

async function safeFetchHtml(target: string): Promise<{ url: string; html: string } | null> {
  let currentUrl = target;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeUrl(currentUrl);
    const res = await undiciFetch(currentUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      dispatcher: safeDispatcher,
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return null;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? '';
    if (!/text\/html|application\/xhtml/i.test(contentType)) return null;

    const declaredLength = Number(res.headers.get('content-length') ?? '0');
    if (declaredLength && declaredLength > MAX_BYTES * 8) return null;

    const html = await readCapped(res, MAX_BYTES);
    return { url: currentUrl, html };
  }
  return null;
}

export async function fetchLinkMetadata(target: string): Promise<LinkMetadata> {
  // Validate up front so the caller (route handler) can map this to a 400.
  // Redirect hops are re-validated inside safeFetchHtml.
  await assertSafeUrl(target);

  const domain = extractDomain(target);
  const fallback: LinkMetadata = {
    url: target,
    title: `Saved from ${domain}`,
    domain,
    excerpt: '',
    imageUrl: buildScreenshotUrl(target),
  };

  try {
    const result = await safeFetchHtml(target);
    if (!result) return fallback;

    const { url: finalUrl, html } = result;
    const title =
      pickMeta(html, ['og:title', 'twitter:title']) ?? pickTitle(html) ?? fallback.title;
    const metaDescription = pickMeta(html, ['og:description', 'twitter:description', 'description']);
    // If the meta description is missing or short enough to be a generic
    // site tagline, prefer the first substantive paragraph of the article.
    const excerpt =
      !metaDescription || metaDescription.length < SHORT_DESCRIPTION_THRESHOLD
        ? (pickFirstBodyParagraph(html) ?? metaDescription ?? '')
        : metaDescription;
    const rawImage = pickMeta(html, ['og:image', 'twitter:image']);
    const imageUrl = rawImage
      ? resolveUrl(rawImage, finalUrl)
      : (pickFirstBodyImage(html, finalUrl) ?? buildScreenshotUrl(target));

    return { url: target, title, domain, excerpt, imageUrl };
  } catch (err) {
    // Re-throw unsafe-URL errors so the route handler can return a 400.
    if (err instanceof UnsafeUrlError) throw err;
    return fallback;
  }
}

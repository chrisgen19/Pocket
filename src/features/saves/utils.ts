export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const units: Array<[number, string]> = [
    [31_536_000, 'y'],
    [2_592_000, 'mo'],
    [86_400, 'd'],
    [3_600, 'h'],
    [60, 'm'],
  ];
  for (const [s, label] of units) {
    const v = Math.floor(seconds / s);
    if (v >= 1) return `${v}${label} ago`;
  }
  return 'just now';
}

export function normalizeUrl(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function placeholderImage(url: string, domain: string): string {
  const hash =
    Math.abs(
      url.split('').reduce((a, b) => {
        const x = (a << 5) - a + b.charCodeAt(0);
        return x & x;
      }, 0),
    ) % 360;
  const initial = domain.charAt(0).toUpperCase() || '?';
  return `https://placehold.co/600x400/hsl(${hash},20%,90%)/hsl(${hash},50%,30%)?text=${initial}`;
}

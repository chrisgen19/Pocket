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

// A leading "scheme:" such as "https:", "mailto:" or "javascript:".
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
// "host:port" that would otherwise look like a scheme: a dotted name, localhost or an
// IPv4 address, then a numeric port followed by a path, query, fragment or the end.
// Requiring a real-looking host keeps "mailto:1@x.com", "tel:12345" or "javascript:1"
// classified as schemes (and rejected) instead of being rewritten to https://.
const HOST_PORT_RE =
  /^(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|[a-z0-9-]+(?:\.[a-z0-9-]+)+):\d+(?:[/?#]|$)/i;

/**
 * Turns user input into an absolute URL to validate: trims it and adds "https://" when
 * there is no scheme, so "example.com/path" becomes "https://example.com/path" and
 * "example.com:8080" becomes "https://example.com:8080". An explicit scheme is kept as
 * typed, so non-http(s) input stays rejectable.
 */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return value;
  return SCHEME_RE.test(value) && !HOST_PORT_RE.test(value) ? value : `https://${value}`;
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

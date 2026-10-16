const FALLBACK = '/saves';
const BASE = 'http://pocket.invalid';

/** Tabs, newlines and other control characters, which the URL parser silently drops. */
const hasControlChar = (value: string): boolean =>
  [...value].some((char) => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f);

/**
 * The post-login redirect from `?next=`, limited to paths in this app. Anything that
 * isn't a bare path (javascript:, data:, //host, absolute URLs) or holds a control
 * character (CR/LF, tab) falls back to /saves.
 *
 * The final check resolves the path the way the browser will, which treats `\` as `/`,
 * so `/\evil.com` can't reach another site either. The result must not start with
 * `//`: resolving `/.//evil.com` leaves the path `//evil.com`, another site once used.
 */
export function sanitizeNext(raw: string | null): string {
  if (!raw?.startsWith('/') || hasControlChar(raw)) return FALLBACK;
  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return FALLBACK;
  }
  if (url.origin !== BASE || url.pathname.startsWith('//')) return FALLBACK;
  return `${url.pathname}${url.search}${url.hash}`;
}

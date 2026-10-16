// Reject anything that isn't an app-relative path: bare paths only, no
// protocol schemes (javascript:, data:), no protocol-relative URLs (//host),
// no Windows-style escapes, no CR/LF (header-injection paranoia). Falls back
// to /saves otherwise.
export function sanitizeNext(raw: string | null): string {
  if (!raw) return '/saves';
  if (!raw.startsWith('/')) return '/saves';
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/saves';
  if (/[\r\n]/.test(raw)) return '/saves';
  return raw;
}

export const DEFAULT_AUTH_REDIRECT = '/saves';
export const PROTECTED_PREFIXES = ['/saves'] as const;

// Reject anything that isn't an app-relative path: bare paths only, no
// protocol schemes, no protocol-relative URLs, no Windows-style escapes, no
// CR/LF header-injection payloads.
export function sanitizeNext(raw: string | null): string {
  if (!raw) return DEFAULT_AUTH_REDIRECT;
  if (!raw.startsWith('/')) return DEFAULT_AUTH_REDIRECT;
  if (raw.startsWith('//') || raw.startsWith('/\\')) return DEFAULT_AUTH_REDIRECT;
  if (/[\r\n]/.test(raw)) return DEFAULT_AUTH_REDIRECT;
  return raw;
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function buildLoginNext(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

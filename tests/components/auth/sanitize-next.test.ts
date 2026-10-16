import { describe, expect, it } from 'vitest';
import { sanitizeNext } from '@/components/auth/sanitize-next';

/** What the login page passes in: `?next=` as `useSearchParams().get()` decodes it. */
const fromQuery = (encoded: string) => new URLSearchParams(`next=${encoded}`).get('next');

describe('sanitizeNext', () => {
  it.each([
    '/saves',
    '/saves?tab=favorites',
    '/saves/x/y',
    '/saves/favorites#top',
    '/settings',
  ])('keeps the app path %s', (path) => {
    expect(sanitizeNext(path)).toBe(path);
  });

  it.each([
    ['null', null],
    ['an empty string', ''],
    ['a relative path', 'saves'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a data: URL', 'data:text/html,<script>alert(1)</script>'],
    ['an absolute URL', 'http://evil.com'],
    ['a protocol-relative URL', '//evil.com'],
    ['a backslash escape', '/\\evil.com'],
    ['CR/LF', '/saves\r\nSet-Cookie: x=1'],
    ['a dot segment hiding //', '/.//evil.com'],
  ])('falls back to /saves for %s', (_label, raw) => {
    expect(sanitizeNext(raw)).toBe('/saves');
  });

  // Browsers drop tabs and newlines while parsing a URL, so these become //evil.com.
  it.each([
    ['a tab', '/%09/evil.com'],
    ['a newline', '/%0A/evil.com'],
    ['a carriage return', '/%0D/evil.com'],
    ['a tab before a backslash', '/%09%5Cevil.com'],
  ])('falls back to /saves when %s hides a protocol-relative URL', (_label, encoded) => {
    expect(sanitizeNext(fromQuery(encoded))).toBe('/saves');
  });

  it('never returns a path that resolves to another origin', () => {
    const attempts = ['/%09/evil.com', '/%5C%5Cevil.com', '/%2F%2Fevil.com', '/.%2F%2Fevil.com'];
    for (const encoded of attempts) {
      const next = sanitizeNext(fromQuery(encoded));
      expect(new URL(next, 'https://pocket.example').origin).toBe('https://pocket.example');
    }
  });
});

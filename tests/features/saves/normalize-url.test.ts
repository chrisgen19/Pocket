import { describe, expect, it } from 'vitest';
import { createBookmarkSchema } from '@/features/saves/schemas';
import { normalizeUrl } from '@/features/saves/utils';

describe('normalizeUrl', () => {
  it.each([
    ['example.com', 'https://example.com'],
    ['  example.com/path?q=1  ', 'https://example.com/path?q=1'],
    ['www.example.com', 'https://www.example.com'],
    ['sub.example.co.uk/a/b', 'https://sub.example.co.uk/a/b'],
    ['user@example.com', 'https://user@example.com'],
    ['intranet', 'https://intranet'],
  ])('adds https:// to the bare domain %j', (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });

  it.each([
    ['example.com:8080', 'https://example.com:8080'],
    ['example.com:8080/x', 'https://example.com:8080/x'],
    ['example.com:8080?q=1', 'https://example.com:8080?q=1'],
    ['localhost:3000', 'https://localhost:3000'],
    ['127.0.0.1:8080', 'https://127.0.0.1:8080'],
    ['[::1]:3000', 'https://[::1]:3000'],
  ])('reads %j as host:port, not a scheme', (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });

  it.each([
    'http://example.com',
    'https://example.com/a',
    'HTTPS://Example.com',
    'mailto:a@b.com',
    'javascript:alert(1)',
    'ftp://example.com',
    'chrome://extensions',
    'data:text/html,hi',
    // Regressions from #43's review: a scheme whose payload starts with a digit used to
    // be read as host:port and rewritten to https://, e.g. https://mailto:1@example.com.
    'mailto:1@example.com',
    'tel:12345',
    'urn:123',
    'sms:123',
    'javascript:1',
    'example.com:8080abc',
  ])('keeps the explicit scheme of %j as typed', (input) => {
    expect(normalizeUrl(input)).toBe(input);
  });

  it('trims surrounding whitespace from URLs with a scheme too', () => {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('returns empty input unchanged', () => {
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl('   ')).toBe('');
  });
});

describe('createBookmarkSchema url (normalizeUrl, then http(s) only)', () => {
  const parse = (url: unknown) => createBookmarkSchema.shape.url.safeParse(url);

  it.each([
    ['example.com', 'https://example.com'],
    ['http://example.org', 'http://example.org'],
    ['localhost:3000', 'https://localhost:3000'],
  ])('accepts %j as %j', (input, expected) => {
    const result = parse(input);
    expect(result.success && result.data).toBe(expected);
  });

  it.each([
    'mailto:a@b.com',
    'mailto:1@example.com',
    'tel:12345',
    'javascript:1',
    'javascript:alert(1)',
    'ftp://example.com',
    'not a url',
    '',
    `example.com/${'a'.repeat(8200)}`,
    123,
  ])('rejects %j', (input) => {
    expect(parse(input).success).toBe(false);
  });
});

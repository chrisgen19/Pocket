import { promises as dns } from 'node:dns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertSafeUrl, isPrivateIP, UnsafeUrlError } from '@/lib/url-safety';

vi.mock('node:dns', () => ({ promises: { lookup: vi.fn() } }));

type LookupResult = Array<{ address: string; family: number }>;
const lookup = vi.mocked(dns.lookup as (host: string, options: object) => Promise<LookupResult>);

/** Answers DNS lookups for hostnames with these addresses. */
const resolvesTo = (...addresses: string[]) =>
  lookup.mockResolvedValue(
    addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })),
  );

beforeEach(() => {
  lookup.mockReset();
});

describe('isPrivateIP', () => {
  it.each([
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1', // CGNAT
    '127.0.0.1',
    '169.254.169.254', // cloud metadata
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '224.0.0.1', // multicast
    '255.255.255.255',
    '::',
    '::1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'ff02::1',
    '::ffff:127.0.0.1', // IPv4-mapped, dotted (as DNS returns it)
    '::ffff:7f00:1', // IPv4-mapped, hex (as the URL parser writes it)
    '::ffff:a9fe:a9fe', // 169.254.169.254, mapped
    '::ffff:a00:1', // 10.0.0.1, mapped
    'not-an-ip',
  ])('treats %s as private', (ip) => {
    expect(isPrivateIP(ip)).toBe(true);
  });

  it.each([
    '8.8.8.8',
    '93.184.216.34',
    '172.32.0.1', // just outside 172.16.0.0/12
    '2606:4700::1111',
    '::ffff:808:808', // 8.8.8.8, mapped
    '::ffff:8.8.8.8',
  ])('treats %s as public', (ip) => {
    expect(isPrivateIP(ip)).toBe(false);
  });
});

describe('assertSafeUrl', () => {
  describe('IP literals (no DNS lookup)', () => {
    it.each([
      'http://8.8.8.8/',
      'https://93.184.216.34/path?q=1',
      'https://[2606:4700::1111]/',
    ])('allows %s', async (url) => {
      await expect(assertSafeUrl(url)).resolves.toBeInstanceOf(URL);
      expect(lookup).not.toHaveBeenCalled();
    });

    it.each([
      'http://127.0.0.1/',
      'http://127.1/', // shorthand for 127.0.0.1
      'http://2130706433/', // 127.0.0.1 as one number
      'http://0x7f.1/', // hex shorthand
      'http://0.0.0.0/',
      'http://10.0.0.1/',
      'http://172.16.0.1/',
      'http://192.168.1.1/',
      'http://169.254.169.254/latest/meta-data/',
      'http://100.64.0.1/',
      'http://[::1]/',
      'http://[fc00::1]/',
      'http://[fe80::1]/',
      'http://[::ffff:127.0.0.1]/',
      'http://[::ffff:169.254.169.254]/',
      'http://[0:0:0:0:0:ffff:10.0.0.1]/',
    ])('blocks %s', async (url) => {
      await expect(assertSafeUrl(url)).rejects.toThrow(UnsafeUrlError);
    });
  });

  it.each([
    'file:///etc/passwd',
    'gopher://example.com/',
    'ftp://example.com/',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
  ])('blocks the %s scheme', async (url) => {
    await expect(assertSafeUrl(url)).rejects.toThrow('Only http and https URLs are allowed');
  });

  it.each(['not a url', 'http://', ''])('blocks the malformed URL %j', async (url) => {
    await expect(assertSafeUrl(url)).rejects.toThrow('Invalid URL');
  });

  describe('hostnames (DNS lookup)', () => {
    it('allows a host that resolves only to public addresses', async () => {
      resolvesTo('93.184.216.34', '2606:2800:220:1::1');
      await expect(assertSafeUrl('https://example.com/a')).resolves.toBeInstanceOf(URL);
      expect(lookup).toHaveBeenCalledWith('example.com', { all: true });
    });

    it('blocks localhost', async () => {
      resolvesTo('127.0.0.1', '::1');
      await expect(assertSafeUrl('http://localhost:3000/')).rejects.toThrow(UnsafeUrlError);
    });

    it('blocks a public-looking host that resolves to a private address', async () => {
      resolvesTo('10.0.0.5');
      await expect(assertSafeUrl('https://internal.example.com/')).rejects.toThrow(
        'URL resolves to a private or reserved address',
      );
    });

    it('blocks a host when any one of its addresses is private', async () => {
      resolvesTo('93.184.216.34', '169.254.169.254');
      await expect(assertSafeUrl('https://mixed.example.com/')).rejects.toThrow(UnsafeUrlError);
    });

    it('blocks a host that resolves to an IPv4-mapped private address', async () => {
      resolvesTo('::ffff:127.0.0.1');
      await expect(assertSafeUrl('https://mapped.example.com/')).rejects.toThrow(UnsafeUrlError);
    });

    it('blocks a host that does not resolve', async () => {
      lookup.mockRejectedValue(
        Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' }),
      );
      await expect(assertSafeUrl('https://nope.invalid/')).rejects.toThrow(
        'Unable to resolve host',
      );
    });

    it('blocks a host that resolves to no addresses', async () => {
      resolvesTo();
      await expect(assertSafeUrl('https://empty.example.com/')).rejects.toThrow(
        'Unable to resolve host',
      );
    });
  });
});

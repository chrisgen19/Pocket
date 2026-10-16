import { fetch as undiciFetch } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/metadata/route';

// The real route, authenticateRequest(), fetchLinkMetadata() and assertSafeUrl() run.
// Every URL below is rejected before any network access (IP literals and schemes need
// no DNS), so a request reaching the network would mean a check failed.
const fake = vi.hoisted(() => ({
  headers: new Headers(),
  getSession: vi.fn(),
  verifyApiKey: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: async () => fake.headers }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: fake.getSession, verifyApiKey: fake.verifyApiKey } },
}));
// The metadata fetcher uses undici's fetch. Keep the rest of undici (safe-fetch.ts
// builds its Agent from it) and make any real request fail loudly.
vi.mock('undici', async (importOriginal) => ({
  ...(await importOriginal<typeof import('undici')>()),
  fetch: vi.fn(async () => {
    throw new Error('Unexpected network request in a test');
  }),
}));

const fetchSpy = vi.mocked(undiciFetch);

const getMetadata = (url: string | null) => {
  const query = url === null ? '' : `?url=${encodeURIComponent(url)}`;
  return GET(new Request(`http://localhost:3000/api/metadata${query}`));
};

beforeEach(() => {
  fake.headers = new Headers();
  fake.getSession.mockReset().mockResolvedValue({ user: { id: 'user-1' } });
  fake.verifyApiKey.mockReset();
  fetchSpy.mockClear();
});

describe('GET /api/metadata', () => {
  it('answers 401 when signed out', async () => {
    fake.getSession.mockResolvedValue(null);
    const res = await getMetadata('https://example.com/');

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('answers 401 for an invalid API key', async () => {
    fake.headers = new Headers({ 'x-api-key': 'pocket_revoked' });
    fake.verifyApiKey.mockResolvedValue({ valid: false });
    const res = await getMetadata('https://example.com/');

    expect(res.status).toBe(401);
  });

  it.each([
    ['a missing url', null],
    ['a value that is not a URL', 'not a url'],
  ])('answers 400 for %s', async (_label, url) => {
    const res = await getMetadata(url);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid url' });
  });

  it.each([
    'http://127.0.0.1/',
    'http://10.0.0.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/', // hex-mapped IPv6, the bypass fixed in #61
    'http://[::ffff:169.254.169.254]/',
  ])('answers 400 for the private address %s, without fetching it', async (url) => {
    const res = await getMetadata(url);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'URL resolves to a private or reserved address' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    'file:///etc/passwd',
    'ftp://example.com/file',
    'gopher://example.com/',
  ])('answers 400 for the non-http URL %s', async (url) => {
    const res = await getMetadata(url);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Only http and https URLs are allowed' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

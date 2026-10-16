import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const ALLOWED_ID = 'a'.repeat(32);
const OTHER_ID = 'b'.repeat(32);
const ALLOWED_ORIGIN = `chrome-extension://${ALLOWED_ID}`;
const SESSION_COOKIE = 'better-auth.session_token=signed-token';

/**
 * Loads src/proxy.ts with this EXTENSION_IDS value. The allowlist is read once at
 * module load, so each call gets a fresh copy of the module.
 */
const loadProxy = async (extensionIds: string | undefined) => {
  vi.resetModules();
  vi.stubEnv('EXTENSION_IDS', extensionIds);
  return (await import('@/proxy')).proxy;
};

const request = (path: string, init: { method?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(`http://localhost:3000${path}`, init);

/** NextResponse.next() marks the response to continue to the route. */
const passesThrough = (res: Response) => res.headers.get('x-middleware-next') === '1';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('proxy CORS on /api/*', () => {
  it('answers a preflight from an allowed extension with credentialed CORS', async () => {
    const proxy = await loadProxy(`${ALLOWED_ID}, ${OTHER_ID}`);
    const res = proxy(
      request('/api/bookmarks', {
        method: 'OPTIONS',
        headers: { origin: ALLOWED_ORIGIN, 'access-control-request-headers': 'content-type' },
      }),
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
    expect(res.headers.get('access-control-allow-methods')).toBe(
      'GET, POST, PATCH, DELETE, OPTIONS',
    );
    expect(res.headers.get('access-control-allow-headers')).toBe('content-type');
    expect(res.headers.get('vary')).toBe('Origin');
  });

  it('adds CORS to a normal request from an allowed extension and lets it through', async () => {
    const proxy = await loadProxy(ALLOWED_ID);
    const res = proxy(request('/api/bookmarks/urls', { headers: { origin: ALLOWED_ORIGIN } }));

    expect(passesThrough(res)).toBe(true);
    expect(res.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
  });

  it.each([
    ['an extension not in the list', `chrome-extension://${OTHER_ID}`],
    ['a website', 'https://evil.example'],
    ['the extension origin with a different scheme', `https://${ALLOWED_ID}`],
  ])('gives no CORS headers to %s', async (_label, origin) => {
    const proxy = await loadProxy(ALLOWED_ID);

    for (const method of ['GET', 'OPTIONS']) {
      const res = proxy(request('/api/bookmarks', { method, headers: { origin } }));
      expect(passesThrough(res)).toBe(true);
      expect(res.headers.get('access-control-allow-origin')).toBeNull();
      expect(res.headers.get('access-control-allow-credentials')).toBeNull();
    }
  });

  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['invalid', `${ALLOWED_ID},not-an-extension-id`],
  ])('fails closed when EXTENSION_IDS is %s', async (_label, value) => {
    const proxy = await loadProxy(value);
    const res = proxy(
      request('/api/bookmarks', { method: 'OPTIONS', headers: { origin: ALLOWED_ORIGIN } }),
    );

    expect(passesThrough(res)).toBe(true);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('never redirects API routes to the login page', async () => {
    const proxy = await loadProxy(ALLOWED_ID);
    expect(passesThrough(proxy(request('/api/bookmarks')))).toBe(true);
  });
});

describe('proxy page protection', () => {
  it.each([
    '/saves',
    '/saves/favorites',
    '/saves/tags/reading',
    '/settings',
  ])('sends a signed-out visitor from %s to /login with next', async (path) => {
    const proxy = await loadProxy(undefined);
    const res = proxy(request(path));

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location') ?? '');
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('next')).toBe(path);
  });

  it.each(['/saves', '/settings'])('lets a visitor with a session cookie into %s', async (path) => {
    const proxy = await loadProxy(undefined);
    expect(passesThrough(proxy(request(path, { headers: { cookie: SESSION_COOKIE } })))).toBe(true);
  });

  it.each(['/login', '/register'])('never bounces %s, signed in or not', async (path) => {
    const proxy = await loadProxy(undefined);
    expect(passesThrough(proxy(request(path)))).toBe(true);
    expect(passesThrough(proxy(request(path, { headers: { cookie: SESSION_COOKIE } })))).toBe(true);
  });

  it.each(['/', '/savesx', '/settings-help'])('does not protect %s', async (path) => {
    const proxy = await loadProxy(undefined);
    expect(passesThrough(proxy(request(path)))).toBe(true);
  });
});

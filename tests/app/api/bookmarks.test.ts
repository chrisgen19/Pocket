import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from '@/app/api/bookmarks/[id]/route';
import { POST } from '@/app/api/bookmarks/route';
import { fetchLinkMetadata } from '@/features/saves/metadata';
import { UnsafeUrlError } from '@/lib/url-safety';
import { bookmarkTable, rows, seed } from './fake-bookmark-table';

// The real route handlers and authenticateRequest() run; only the request headers,
// Better Auth's lookups, the metadata fetch and the database are faked.
const fake = vi.hoisted(() => ({
  headers: new Headers(),
  getSession: vi.fn(),
  verifyApiKey: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: async () => fake.headers }));
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: fake.getSession, verifyApiKey: fake.verifyApiKey } },
}));
vi.mock('@/features/saves/metadata', () => ({ fetchLinkMetadata: vi.fn() }));
vi.mock('@/lib/prisma', async () => {
  const { bookmarkTable } = await import('./fake-bookmark-table');
  return { prisma: { bookmark: bookmarkTable }, isPrismaError: () => false };
});

const fetchMetadata = vi.mocked(fetchLinkMetadata);

const signInAs = (userId: string | null) => {
  fake.getSession.mockResolvedValue(userId ? { user: { id: userId } } : null);
};

const jsonRequest = (method: string, body: unknown) =>
  new Request('http://localhost:3000/api/bookmarks', {
    method,
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const patch = (id: string, body: unknown) =>
  PATCH(jsonRequest('PATCH', body), { params: Promise.resolve({ id }) });

beforeEach(() => {
  fake.headers = new Headers();
  fake.getSession.mockReset();
  fake.verifyApiKey.mockReset();
  rows.length = 0;
  vi.clearAllMocks();
  signInAs('user-1');
  fetchMetadata.mockImplementation(async (url) => ({
    url,
    title: `Title of ${url}`,
    domain: new URL(url).hostname,
    excerpt: 'Fresh excerpt',
    imageUrl: '',
  }));
});

describe('PATCH /api/bookmarks/[id]', () => {
  it('answers 401 when signed out, without touching the database', async () => {
    signInAs(null);
    const res = await patch('b1', { isFavorite: true });

    expect(res.status).toBe(401);
    expect(bookmarkTable.updateManyAndReturn).not.toHaveBeenCalled();
  });

  it.each([
    ['an empty object', {}],
    ['only unknown fields', { title: 'Renamed', userId: 'user-2' }],
    ['a wrong type', { isFavorite: 'yes' }],
    ['invalid JSON', '{not json'],
  ])('answers 400 for %s', async (_label, body) => {
    seed({ id: 'b1', userId: 'user-1' });
    const res = await patch('b1', body);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'Invalid input' });
    expect(bookmarkTable.updateManyAndReturn).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown id', async () => {
    seed({ id: 'b1', userId: 'user-1' });
    const res = await patch('missing', { isFavorite: true });

    expect(res.status).toBe(404);
  });

  it("answers 404 for someone else's bookmark and leaves it unchanged", async () => {
    seed({ id: 'theirs', userId: 'user-2', isFavorite: false });
    const res = await patch('theirs', { isFavorite: true });

    expect(res.status).toBe(404);
    expect(bookmarkTable.updateManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'theirs', userId: 'user-1' } }),
    );
    expect(rows[0].isFavorite).toBe(false);
  });

  it('answers 200 with the updated row, changing only the sent fields', async () => {
    seed({ id: 'b1', userId: 'user-1', isFavorite: false, isArchived: true, tags: ['old'] });
    const res = await patch('b1', { isFavorite: true, tags: ['Design', ' design ', 'News'] });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: 'b1',
      isFavorite: true,
      isArchived: true,
      tags: ['design', 'news'],
    });
  });
});

describe('POST /api/bookmarks', () => {
  it('creates a new bookmark with 201', async () => {
    const res = await POST(jsonRequest('POST', { url: 'https://example.com/a', tags: ['Read'] }));

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      url: 'https://example.com/a',
      userId: 'user-1',
      title: 'Title of https://example.com/a',
      tags: ['read'],
      isArchived: false,
    });
    expect(rows).toHaveLength(1);
  });

  it('answers 200 for a URL already saved: merges tags, un-archives, refreshes metadata', async () => {
    seed({
      id: 'b1',
      userId: 'user-1',
      url: 'https://example.com/a',
      title: 'Old title',
      tags: ['Design', 'old'],
      isArchived: true,
      isFavorite: true,
    });
    const res = await POST(
      jsonRequest('POST', { url: 'https://example.com/a', tags: ['design', 'New'] }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: 'b1',
      title: 'Title of https://example.com/a',
      tags: ['design', 'old', 'new'],
      isArchived: false,
      isFavorite: true,
    });
    expect(rows).toHaveLength(1);
  });

  it('creates a separate row when another user saved the same URL', async () => {
    seed({ id: 'theirs', userId: 'user-2', url: 'https://example.com/a', tags: ['private'] });
    const res = await POST(jsonRequest('POST', { url: 'https://example.com/a' }));

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ userId: 'user-1', tags: [] });
    expect(rows.find((row) => row.id === 'theirs')?.tags).toEqual(['private']);
  });

  it('stores a bare domain as https', async () => {
    const res = await POST(jsonRequest('POST', { url: 'example.com/path' }));

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ url: 'https://example.com/path' });
  });

  it.each([
    ['no url', {}],
    ['a non-http scheme', { url: 'ftp://example.com/file' }],
    ['a javascript: URL', { url: 'javascript:alert(1)' }],
    ['invalid JSON', '{not json'],
  ])('answers 400 for %s, without fetching or writing', async (_label, body) => {
    const res = await POST(jsonRequest('POST', body));

    expect(res.status).toBe(400);
    expect(fetchMetadata).not.toHaveBeenCalled();
    expect(bookmarkTable.upsert).not.toHaveBeenCalled();
  });

  it('answers 400 for a URL that resolves to a private address, without writing', async () => {
    fetchMetadata.mockRejectedValue(
      new UnsafeUrlError('URL resolves to a private or reserved address'),
    );
    const res = await POST(jsonRequest('POST', { url: 'http://internal.example.com/' }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'URL resolves to a private or reserved address' });
    expect(bookmarkTable.upsert).not.toHaveBeenCalled();
  });

  it('answers 401 when signed out', async () => {
    signInAs(null);
    const res = await POST(jsonRequest('POST', { url: 'https://example.com/a' }));

    expect(res.status).toBe(401);
    expect(fetchMetadata).not.toHaveBeenCalled();
  });

  it('saves for the owner of a valid API key', async () => {
    signInAs(null);
    fake.headers = new Headers({ 'x-api-key': 'pocket_valid' });
    fake.verifyApiKey.mockResolvedValue({ valid: true, key: { referenceId: 'user-3' } });
    const res = await POST(jsonRequest('POST', { url: 'https://example.com/a' }));

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ userId: 'user-3' });
  });

  it('answers 401 for an invalid API key, even with a session cookie', async () => {
    fake.headers = new Headers({ 'x-api-key': 'pocket_revoked' });
    fake.verifyApiKey.mockResolvedValue({ valid: false, error: { code: 'KEY_NOT_FOUND' } });
    const res = await POST(jsonRequest('POST', { url: 'https://example.com/a' }));

    expect(res.status).toBe(401);
    expect(fake.getSession).not.toHaveBeenCalled();
    expect(rows).toHaveLength(0);
  });
});

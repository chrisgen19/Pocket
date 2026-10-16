import { afterEach, describe, expect, it, vi } from 'vitest';
import { findBookmarkByUrl } from '@/lib/api';

const PAGE = 'https://page.example/article';

const bookmark = (url: string) => ({
  id: url,
  url,
  createdAt: '2026-10-01T00:00:00.000Z',
  tags: [],
  isArchived: false,
});

/** Answers every fetch with this JSON body. */
const respondWith = (body: unknown) => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('findBookmarkByUrl', () => {
  it('asks the server about exactly this URL', async () => {
    const fetchMock = respondWith([bookmark(PAGE)]);

    expect(await findBookmarkByUrl(PAGE)).toMatchObject({ url: PAGE });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/api/bookmarks?url=${encodeURIComponent(PAGE)}`),
      expect.anything(),
    );
  });

  it('answers null when the server has no save of it', async () => {
    respondWith([]);

    expect(await findBookmarkByUrl(PAGE)).toBeNull();
  });

  // A server without `?url=` support ignores it and sends the whole list, newest first.
  it('does not take the newest save from a full list for this page', async () => {
    respondWith([bookmark('https://newest.example'), bookmark('https://older.example')]);

    expect(await findBookmarkByUrl(PAGE)).toBeNull();
  });

  it('finds this page in a full list from such a server', async () => {
    respondWith([bookmark('https://newest.example'), bookmark(PAGE)]);

    expect(await findBookmarkByUrl(PAGE)).toMatchObject({ url: PAGE });
  });
});

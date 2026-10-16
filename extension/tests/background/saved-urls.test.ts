import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({ listSavedUrls: vi.fn() }));

const listSavedUrls = vi.mocked(api.listSavedUrls);

type SavedUrls = typeof import('@/background/saved-urls');

/** A promise the test settles by hand, to hold a refresh's request open. */
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/** Holds the next listSavedUrls() call open until the test settles it. */
const holdNextRefresh = () => {
  const request = deferred<string[] | null>();
  listSavedUrls.mockReturnValueOnce(request.promise);
  return request;
};

// Fake chrome.storage.local: async like the real one, so concurrent calls interleave.
let store: Record<string, unknown> = {};
let storageFull = false;
const stored = () => store.savedUrls;

let cache: SavedUrls;

beforeEach(async () => {
  store = {};
  storageFull = false;
  listSavedUrls.mockReset();
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: async (key: string) => {
          await Promise.resolve();
          return key in store ? { [key]: structuredClone(store[key]) } : {};
        },
        set: async (items: Record<string, unknown>) => {
          await Promise.resolve();
          if (storageFull) throw new Error('QUOTA_BYTES quota exceeded');
          Object.assign(store, structuredClone(items));
        },
      },
    },
  });
  // A fresh module per test: its in-memory memo and refresh counter start empty.
  vi.resetModules();
  cache = await import('@/background/saved-urls');
});

describe('refreshSavedUrls while it is in flight', () => {
  it('keeps a save made after the request started', async () => {
    const request = holdNextRefresh();
    const refresh = cache.refreshSavedUrls();

    await cache.setSaved('https://new.example', true);
    request.resolve(['https://old.example']); // Fetched before the save reached the server.
    await refresh;

    expect(stored()).toEqual(['https://old.example', 'https://new.example']);
    expect(await cache.isSaved('https://new.example')).toBe(true);
  });

  it('keeps an unsave made after the request started', async () => {
    const request = holdNextRefresh();
    const refresh = cache.refreshSavedUrls();

    await cache.setSaved('https://gone.example', false);
    request.resolve(['https://gone.example', 'https://kept.example']);
    await refresh;

    expect(stored()).toEqual(['https://kept.example']);
  });

  it('drops an older response that arrives after a newer one', async () => {
    const older = holdNextRefresh();
    const first = cache.refreshSavedUrls();
    const newer = holdNextRefresh();
    const second = cache.refreshSavedUrls();

    newer.resolve(['https://account-b.example']);
    await second;
    older.resolve(['https://account-a.example']);
    await first;

    expect(stored()).toEqual(['https://account-b.example']);
  });

  it('drops the response once the cache was cleared on sign-out', async () => {
    store.savedUrls = ['https://account-a.example'];
    const request = holdNextRefresh();
    const refresh = cache.refreshSavedUrls();

    await cache.clearSavedUrls();
    request.resolve(['https://account-a.example']);
    await refresh;

    expect(stored()).toEqual([]);
    expect(await cache.isSaved('https://account-a.example')).toBe(false);
  });

  it('empties the cache when signed out, ignoring saves made meanwhile', async () => {
    const request = holdNextRefresh();
    const refresh = cache.refreshSavedUrls();

    await cache.setSaved('https://new.example', true);
    request.resolve(null);
    await refresh;

    expect(stored()).toEqual([]);
  });

  it('keeps the current cache when the request fails', async () => {
    store.savedUrls = ['https://kept.example'];
    const request = holdNextRefresh();
    const refresh = cache.refreshSavedUrls();

    request.reject(new Error('offline'));
    await refresh;

    expect(stored()).toEqual(['https://kept.example']);
  });
});

describe('when storage writes fail', () => {
  it('still records a save for this worker, without rejecting', async () => {
    storageFull = true;

    await expect(cache.setSaved('https://new.example', true)).resolves.toBeUndefined();
    expect(await cache.isSaved('https://new.example')).toBe(true);
  });

  it('still applies a refresh for this worker, without rejecting', async () => {
    storageFull = true;
    listSavedUrls.mockResolvedValueOnce(['https://a.example']);

    await expect(cache.refreshSavedUrls()).resolves.toBeUndefined();
    expect(await cache.isSaved('https://a.example')).toBe(true);
  });
});

describe('setSaved', () => {
  it('keeps both of two concurrent changes', async () => {
    store.savedUrls = ['https://a.example'];

    await Promise.all([
      cache.setSaved('https://b.example', true),
      cache.setSaved('https://a.example', false),
    ]);

    expect(stored()).toEqual(['https://b.example']);
  });
});

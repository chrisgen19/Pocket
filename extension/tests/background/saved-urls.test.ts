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

// A storage read held open by the test answers with what was stored when it started,
// like a real read that was already in flight when a newer write landed.
let heldGet: Promise<void> | null = null;
const holdNextGet = () => {
  const release = deferred<void>();
  heldGet = release.promise;
  return () => release.resolve();
};

/** Lets every pending promise chain run, including ones several awaits deep. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const setIcon = vi.fn(async (_details: unknown) => {});
const setTitle = vi.fn(async (_details: { tabId: number; title: string }) => {});

let cache: SavedUrls;

beforeEach(async () => {
  store = {};
  storageFull = false;
  heldGet = null;
  listSavedUrls.mockReset();
  setIcon.mockClear();
  setTitle.mockClear();
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: async (key: string) => {
          const snapshot = key in store ? { [key]: structuredClone(store[key]) } : {};
          const hold = heldGet;
          heldGet = null;
          await (hold ?? Promise.resolve());
          return snapshot;
        },
        set: async (items: Record<string, unknown>) => {
          await Promise.resolve();
          if (storageFull) throw new Error('QUOTA_BYTES quota exceeded');
          Object.assign(store, structuredClone(items));
        },
      },
    },
    action: { setIcon, setTitle },
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

describe('first read after the worker starts', () => {
  it('does not let a slow read undo a save that landed meanwhile', async () => {
    const release = holdNextGet();
    const firstRead = cache.isSaved('https://new.example');
    const save = cache.setSaved('https://new.example', true);
    await settle();

    release(); // Answers with the list from before the save.
    await Promise.all([firstRead, save]);

    expect(await cache.isSaved('https://new.example')).toBe(true);
  });
});

describe('updateActionForTab', () => {
  it('shows the URL the tab is on now when updates overlap', async () => {
    store.savedUrls = ['https://left.example'];
    const release = holdNextGet();
    const older = cache.updateActionForTab(1, 'https://left.example');
    const newer = cache.updateActionForTab(1, 'https://current.example');
    await settle();

    release();
    await Promise.all([older, newer]);

    expect(setIcon).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenLastCalledWith({ tabId: 1, title: 'Save to Pocket' });
  });

  it('updates different tabs independently', async () => {
    store.savedUrls = ['https://saved.example'];

    await Promise.all([
      cache.updateActionForTab(1, 'https://saved.example'),
      cache.updateActionForTab(2, 'https://other.example'),
    ]);

    expect(setTitle).toHaveBeenCalledWith({ tabId: 1, title: 'Saved to Pocket' });
    expect(setTitle).toHaveBeenCalledWith({ tabId: 2, title: 'Save to Pocket' });
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

/// <reference types="chrome" />
import { listSavedUrls } from '@/lib/api';

// The user's saved URLs, cached in storage so the toolbar icon can show "saved"
// without sending every visited URL to the server. Matching is exact, like the
// server's unique (userId, url) key that re-saving upserts on.

const STORAGE_KEY = 'savedUrls';

// public/icons is copied to the extension root, next to the service worker.
const SAVED_ICON = {
  '16': '/icons/icon-16.png',
  '32': '/icons/icon-32.png',
  '48': '/icons/icon-48.png',
  '128': '/icons/icon-128.png',
};
const UNSAVED_ICON = {
  '16': '/icons/icon-unsaved-16.png',
  '32': '/icons/icon-unsaved-32.png',
  '48': '/icons/icon-unsaved-48.png',
  '128': '/icons/icon-unsaved-128.png',
};

// Memo of the stored list. The worker can stop at any time, so this is only a
// shortcut: it is rebuilt from storage on the first read after a restart.
let memo: Set<string> | null = null;

const readUrls = async (): Promise<Set<string>> => {
  if (memo) return memo;
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const urls = stored[STORAGE_KEY];
  memo = new Set(Array.isArray(urls) ? (urls as string[]) : []);
  return memo;
};

// Never throws: a failed write (storage full or unavailable) must not turn a
// successful save into an error badge or skip the icon updates after a refresh.
// The memo stays right until the worker stops, and the next refresh writes again.
const writeUrls = async (urls: Set<string>): Promise<void> => {
  memo = urls;
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: [...urls] });
  } catch {
    // Keep serving from the memo.
  }
};

// Cache changes run one at a time, so a read-modify-write can't drop another's change.
let queue: Promise<unknown> = Promise.resolve();
const exclusive = <T>(change: () => Promise<T>): Promise<T> => {
  const run = queue.then(change, change);
  queue = run.catch(() => {});
  return run;
};

// Only the newest refresh may write: an older response (e.g. from before an account
// switch) is dropped. Saves made while a refresh is in flight are recorded here and
// applied on top of its result, since the server list may predate them.
let latestRefresh = 0;
const editsDuringRefresh = new Set<Map<string, boolean>>();

/**
 * Replaces the cache with the server's list, or empties it when signed out. A
 * network or server error keeps the current cache until the next refresh.
 */
export const refreshSavedUrls = async (): Promise<void> => {
  const refresh = ++latestRefresh;
  const edits = new Map<string, boolean>();
  editsDuringRefresh.add(edits);
  let urls: string[] | null;
  try {
    urls = await listSavedUrls();
  } catch {
    // Offline or server error: keep the last known list.
    editsDuringRefresh.delete(edits);
    return;
  }
  await exclusive(async () => {
    editsDuringRefresh.delete(edits);
    if (refresh !== latestRefresh) return;
    const next = new Set(urls ?? []);
    if (urls) for (const [url, saved] of edits) saved ? next.add(url) : next.delete(url);
    await writeUrls(next);
  });
};

/** Empties the cache now (sign-out) and drops any refresh still in flight. */
export const clearSavedUrls = (): Promise<void> => {
  latestRefresh++;
  return exclusive(() => writeUrls(new Set()));
};

export const isSaved = async (url: string): Promise<boolean> => (await readUrls()).has(url);

/** Records one URL as saved (or not), e.g. after a save or the popup's lookup. */
export const setSaved = (url: string, saved: boolean): Promise<void> =>
  exclusive(async () => {
    for (const edits of editsDuringRefresh) edits.set(url, saved);
    const urls = await readUrls();
    if (urls.has(url) === saved) return;
    const next = new Set(urls);
    if (saved) next.add(url);
    else next.delete(url);
    await writeUrls(next);
  });

/** Shows the saved or unsaved icon and tooltip on one tab. */
export const updateActionForTab = async (tabId: number, url: string | undefined) => {
  const saved = Boolean(url && /^https?:/.test(url) && (await isSaved(url)));
  try {
    await chrome.action.setIcon({ tabId, path: saved ? SAVED_ICON : UNSAVED_ICON });
    await chrome.action.setTitle({ tabId, title: saved ? 'Saved to Pocket' : 'Save to Pocket' });
  } catch {
    // The tab closed before the icon was set.
  }
};

/** Re-checks every open tab, e.g. after the cache was refreshed. */
export const updateAllTabs = async (): Promise<void> => {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map((tab) => (tab.id == null ? undefined : updateActionForTab(tab.id, tab.url))),
  );
};

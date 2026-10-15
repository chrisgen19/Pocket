'use client';

import { normalizeTags } from '@shared/tags';
import type { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api-error';
import * as api from './api';
import { BOOKMARKS_KEY, isUrlCached, upsertSavedBookmark } from './cache';
import { displayUrl } from './omnibox';
import { isQueueActive, type PendingSave, useSaveQueueStore } from './save-queue-store';
import { useToastStore } from './toast-store';

// Each save waits on the server fetching the page (up to ~10s), so a pasted list runs
// a few at a time instead of all at once.
const MAX_CONCURRENT = 3;
// Signing in again resets the queue, so the link has to be pasted again.
const SESSION_ENDED = 'Your session has ended. Sign in again, then save the link again.';

const store = useSaveQueueStore;
const controllers = new Map<string, AbortController>();
// What the current batch (everything since the queue was last idle) has done so far.
const EMPTY_BATCH = { total: 0, saved: 0, failed: 0, lastUrl: '' };
let batch = { ...EMPTY_BATCH };

// The server's link-safety messages (src/lib/url-safety.ts), in the words of the UI.
const FRIENDLY_ERRORS: Array<[RegExp, string]> = [
  [/private or reserved/i, "Pocket can't save links to local or private network addresses."],
  [/unable to resolve host/i, "That site couldn't be found. Check the address."],
];

const toast = (message: string) => useToastStore.getState().show(message);
const announce = (text: string) =>
  store.setState((s) => ({ announcement: { id: (s.announcement?.id ?? 0) + 1, text } }));
const update = (url: string, changes: Partial<PendingSave>) =>
  store.setState((s) => ({
    items: s.items.map((i) => (i.url === url ? { ...i, ...changes } : i)),
  }));
const remove = (url: string) =>
  store.setState((s) => ({ items: s.items.filter((i) => i.url !== url) }));

/**
 * Queues links to save with the given tags. A link already queued gets the tags merged
 * in, a failed one is queued again, one that is saving right now is left alone.
 */
export const enqueueSaves = (qc: QueryClient, urls: string[], tags: string[]): void => {
  const before = store.getState().items;
  const items = [...before];
  const queued: string[] = [];
  for (const url of urls) {
    const at = items.findIndex((i) => i.url === url);
    if (at !== -1 && items[at].status === 'saving') continue;
    const merged = at === -1 ? tags : normalizeTags([...items[at].tags, ...tags]);
    const item: PendingSave = { url, tags: merged, status: 'queued', retryable: true };
    if (at === -1) items.push(item);
    else items[at] = item;
    queued.push(url);
  }
  if (queued.length === 0) {
    toast('Already saving that link');
    return;
  }
  if (!isQueueActive(before)) batch = { ...EMPTY_BATCH };
  batch = { ...batch, total: batch.total + queued.length };
  store.setState({ items });
  announce(
    queued.length === 1 ? `Saving ${displayUrl(queued[0])}` : `Saving ${queued.length} links`,
  );
  pump(qc);
};

export const retrySave = (qc: QueryClient, url: string): void => {
  if (!isQueueActive(store.getState().items)) batch = { ...EMPTY_BATCH };
  batch = { ...batch, total: batch.total + 1 };
  update(url, { status: 'queued', error: undefined });
  pump(qc);
};

export const dismissSave = (url: string): void =>
  store.setState((s) => ({ items: s.items.filter((i) => i.url !== url || i.status === 'saving') }));

/** Drops everything and ignores saves still in flight. Call before clearing the cache. */
export const resetSaveQueue = (): void => {
  for (const controller of controllers.values()) controller.abort();
  controllers.clear();
  batch = { ...EMPTY_BATCH };
  store.setState((s) => ({ items: [], epoch: s.epoch + 1, announcement: null }));
};

/** Starts queued saves up to the concurrency limit, claiming them in one update. */
const pump = (qc: QueryClient): void => {
  const { items, epoch } = store.getState();
  const free = MAX_CONCURRENT - items.filter((i) => i.status === 'saving').length;
  const next = items.filter((i) => i.status === 'queued').slice(0, Math.max(free, 0));
  if (next.length === 0) return;
  const claimed = new Set(next.map((i) => i.url));
  store.setState({
    items: items.map((i) => (claimed.has(i.url) ? { ...i, status: 'saving' } : i)),
  });
  for (const item of next) void runItem(qc, item, epoch);
};

const runItem = async (qc: QueryClient, item: PendingSave, epoch: number): Promise<void> => {
  const isCurrent = () => store.getState().epoch === epoch;
  const controller = new AbortController();
  controllers.set(item.url, controller);
  try {
    const input = { url: item.url, tags: item.tags };
    const { bookmark, created } = await api.createBookmark(input, controller.signal);
    if (!isCurrent()) return;
    const previous = await upsertSavedBookmark(qc, bookmark, created, isCurrent);
    remove(item.url);
    batch = { ...batch, saved: batch.saved + 1, lastUrl: item.url };
    // In a batch the summary toast covers it.
    if (!created && batch.total === 1) {
      toast(
        previous?.isArchived
          ? 'Already in your saves, moved back to Home'
          : 'Already in your saves, refreshed',
      );
    }
  } catch (err) {
    if (isCurrent()) handleFailure(qc, item, err);
  } finally {
    controllers.delete(item.url);
    if (isCurrent()) {
      pump(qc);
      settle(qc);
    }
  }
};

const failureMessage = (err: unknown): string => {
  if (isApiError(err)) {
    if (err.status === 401) return SESSION_ENDED;
    return FRIENDLY_ERRORS.find(([re]) => re.test(err.message))?.[1] ?? err.message;
  }
  if (err instanceof TypeError) return "Couldn't reach Pocket. Check your connection.";
  return "Couldn't save this link.";
};

const handleFailure = (qc: QueryClient, item: PendingSave, err: unknown): void => {
  batch = { ...batch, failed: batch.failed + 1 };
  const message = failureMessage(err);
  if (isUrlCached(qc, item.url)) {
    // Refreshing a save that's already listed: there's no pending row to show this on.
    remove(item.url);
    toast(`Couldn't refresh ${displayUrl(item.url)}. ${message}`);
    return;
  }
  if (isApiError(err) && err.status === 401) {
    // The session ended, so nothing still queued can succeed either.
    store.setState((s) => ({
      items: s.items.map((i) =>
        i.url === item.url || i.status === 'queued'
          ? { ...i, status: 'error', error: SESSION_ENDED, retryable: false }
          : i,
      ),
    }));
    return;
  }
  // Other 4xx (e.g. a link the server won't fetch) fail the same way on retry.
  const status = isApiError(err) ? err.status : 0;
  const permanent = status >= 400 && status < 500 && status !== 408 && status !== 429;
  update(item.url, { status: 'error', error: message, retryable: !permanent });
};

/** When nothing is queued or saving any more: reconcile the list and report the batch. */
const settle = (qc: QueryClient): void => {
  if (isQueueActive(store.getState().items)) return;
  const { saved, failed, lastUrl } = batch;
  batch = { ...EMPTY_BATCH };
  if (saved + failed === 0) return;
  void qc.invalidateQueries({ queryKey: BOOKMARKS_KEY });
  if (failed === 0) {
    announce(saved === 1 ? `Saved ${displayUrl(lastUrl)}` : `Saved ${saved} links`);
    if (saved > 1) toast(`Saved ${saved} links`);
    return;
  }
  const text =
    saved === 0
      ? `Couldn't save ${failed === 1 ? 'the link' : `${failed} links`}`
      : `Saved ${saved} ${saved === 1 ? 'link' : 'links'}, ${failed} failed`;
  announce(text);
  if (saved + failed > 1) toast(text);
};

import type { QueryClient } from '@tanstack/react-query';
import type { Bookmark } from './types';

export const BOOKMARKS_KEY = ['bookmarks'] as const;

/** Puts a bookmark into a newest-first list at its dateAdded position (replacing its id). */
export const insertByDate = (list: Bookmark[], bookmark: Bookmark): Bookmark[] => {
  const rest = list.filter((b) => b.id !== bookmark.id);
  const at = rest.findIndex((b) => b.dateAdded < bookmark.dateAdded);
  return at === -1 ? [...rest, bookmark] : [...rest.slice(0, at), bookmark, ...rest.slice(at)];
};

/** True when a save for this URL is already in the loaded list. */
export const isUrlCached = (qc: QueryClient, url: string): boolean =>
  qc.getQueryData<Bookmark[]>(BOOKMARKS_KEY)?.some((b) => b.url === url) ?? false;

/**
 * Applies a POST /api/bookmarks result to the cached list and returns the row it
 * replaced, if any. The server upserts on (user, url) and keeps createdAt, so:
 * - already listed: replace in place;
 * - new: cancel in-flight refetches first (a refetch that started before the save
 *   would otherwise overwrite the insert), then insert by date;
 * - existing on the server but not in the cache (stale list), or nothing cached yet:
 *   refetch instead of guessing.
 * `isCurrent` is checked after the await, so a sign-out that cleared the cache in the
 * meantime doesn't get this row written back into it.
 */
export const upsertSavedBookmark = async (
  qc: QueryClient,
  bookmark: Bookmark,
  created: boolean,
  isCurrent: () => boolean = () => true,
): Promise<Bookmark | undefined> => {
  const list = qc.getQueryData<Bookmark[]>(BOOKMARKS_KEY);
  const previous = list?.find((b) => b.id === bookmark.id);
  if (previous) {
    qc.setQueryData<Bookmark[]>(BOOKMARKS_KEY, (cur = []) =>
      cur.map((b) => (b.id === bookmark.id ? bookmark : b)),
    );
    return previous;
  }
  if (!list || !created) {
    await qc.invalidateQueries({ queryKey: BOOKMARKS_KEY });
    return undefined;
  }
  await qc.cancelQueries({ queryKey: BOOKMARKS_KEY });
  if (!isCurrent()) return undefined;
  qc.setQueryData<Bookmark[]>(BOOKMARKS_KEY, (cur = []) => insertByDate(cur, bookmark));
  return undefined;
};

'use client';

import { normalizeTag } from '@shared/tags';
import { useMemo } from 'react';
import type { PendingSave } from '@/features/saves/save-queue-store';
import { matchesSearch, searchTerms } from '@/features/saves/search';
import type { Bookmark, SavesCategory } from '@/features/saves/types';

/**
 * The saves the current route shows: Home hides archived saves, Favorites and Archive
 * filter on their flag, a tag narrows Home further, and a search query narrows any view.
 */
export const useVisibleBookmarks = (
  bookmarks: Bookmark[],
  category: SavesCategory,
  tagFilter: string | null,
  query: string,
): Bookmark[] =>
  useMemo(() => {
    let list = bookmarks;
    if (category === 'home') list = list.filter((b) => !b.isArchived);
    else if (category === 'favorites') list = list.filter((b) => b.isFavorite);
    else if (category === 'archive') list = list.filter((b) => b.isArchived);
    if (tagFilter) {
      // Case-insensitive: /saves/tags/Design matches "design", and rows saved
      // before server-side tag normalization still match their lowercase route.
      const wanted = normalizeTag(tagFilter);
      list = list.filter((b) => b.tags.some((t) => normalizeTag(t) === wanted));
    }
    const terms = searchTerms(query);
    return terms.length > 0 ? list.filter((b) => matchesSearch(b, terms)) : list;
  }, [bookmarks, category, tagFilter, query]);

/**
 * Splits the save queue for the current view: `pending` are new links to show as rows
 * at the top (Home, or a tag view they're tagged for, and not while searching);
 * `busyUrls` are listed saves being saved again, shown as busy in place.
 */
export const splitPendingSaves = (
  items: PendingSave[],
  bookmarks: Bookmark[],
  category: SavesCategory,
  tagFilter: string | null,
  query: string,
): { pending: PendingSave[]; busyUrls: Set<string> } => {
  const listed = new Set(bookmarks.map((b) => b.url));
  const busyUrls = new Set(
    items.filter((i) => i.status !== 'error' && listed.has(i.url)).map((i) => i.url),
  );
  if (category !== 'home' || query) return { pending: [], busyUrls };
  const tag = tagFilter ? normalizeTag(tagFilter) : null;
  const pending = items.filter((i) => !listed.has(i.url) && (!tag || i.tags.includes(tag)));
  return { pending, busyUrls };
};

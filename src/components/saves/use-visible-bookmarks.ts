'use client';

import { normalizeTag } from '@shared/tags';
import { useMemo } from 'react';
import type { Bookmark, SavesCategory } from '@/features/saves/types';

/**
 * The saves the current route shows: Home hides archived saves, Favorites and Archive
 * filter on their flag, and a tag narrows Home further.
 */
export const useVisibleBookmarks = (
  bookmarks: Bookmark[],
  category: SavesCategory,
  tagFilter: string | null,
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
    return list;
  }, [bookmarks, category, tagFilter]);

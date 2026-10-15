'use client';

import { Archive, House, Star } from 'lucide-react';
import { useMemo } from 'react';
import { useBookmarks } from '@/features/saves/hooks';
import type { SavesCategory } from '@/features/saves/types';

export const SAVES_CATEGORIES: Array<{
  key: SavesCategory;
  label: string;
  href: string;
  Icon: typeof House;
}> = [
  { key: 'home', label: 'Home', href: '/saves', Icon: House },
  { key: 'favorites', label: 'Favorites', href: '/saves/favorites', Icon: Star },
  { key: 'archive', label: 'Archive', href: '/saves/archive', Icon: Archive },
];

/**
 * Tag navigation shared by the desktop sidebar and the mobile nav. The category and
 * tag both come from the route (/saves, /saves/favorites, /saves/archive,
 * /saves/tags/[tag]), which is the source of truth, so links are plain hrefs.
 */
export const useSavesNav = (tagFilter: string | null) => {
  const { data: bookmarks = [] } = useBookmarks();

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookmarks) for (const t of b.tags) set.add(t);
    return [...set].sort();
  }, [bookmarks]);

  // Clicking the active tag again clears the filter.
  const tagHref = (tag: string) =>
    tagFilter === tag ? '/saves' : `/saves/tags/${encodeURIComponent(tag)}`;

  return { tags, tagHref };
};

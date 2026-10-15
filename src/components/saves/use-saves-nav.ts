'use client';

import { Archive, House, type LucideIcon, Star } from 'lucide-react';
import { useMemo } from 'react';
import { useBookmarks } from '@/features/saves/hooks';
import type { SavesCategory } from '@/features/saves/types';

export const SAVES_CATEGORIES: Array<{
  key: SavesCategory;
  label: string;
  href: string;
  Icon: LucideIcon;
}> = [
  { key: 'home', label: 'Home', href: '/saves', Icon: House },
  { key: 'favorites', label: 'Favorites', href: '/saves/favorites', Icon: Star },
  { key: 'archive', label: 'Archive', href: '/saves/archive', Icon: Archive },
];

/**
 * Tag navigation shared by the desktop sidebar and the mobile nav. The category and
 * tag both come from the route (/saves, /saves/favorites, /saves/archive,
 * /saves/tags/[tag]), which is the source of truth, so links are plain hrefs.
 *
 * Counts match what each view lists: Home and tag views leave archived saves out,
 * Favorites includes them.
 */
export const useSavesNav = (tagFilter: string | null) => {
  const { data } = useBookmarks();

  const { tags, counts, tagCounts } = useMemo(() => {
    const counts: Record<SavesCategory, number> = { home: 0, favorites: 0, archive: 0 };
    const tagCounts = new Map<string, number>();
    for (const b of data ?? []) {
      if (b.isArchived) counts.archive += 1;
      else counts.home += 1;
      if (b.isFavorite) counts.favorites += 1;
      for (const t of b.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + (b.isArchived ? 0 : 1));
    }
    return { tags: [...tagCounts.keys()].sort(), counts, tagCounts };
  }, [data]);

  // Clicking the active tag again clears the filter.
  const tagHref = (tag: string) =>
    tagFilter === tag ? '/saves' : `/saves/tags/${encodeURIComponent(tag)}`;

  return {
    tags,
    /** Null until saves load, so no misleading zeros flash in. */
    countFor: (key: SavesCategory) => (data ? counts[key] : null),
    tagCountFor: (tag: string) => (data ? (tagCounts.get(tag) ?? 0) : null),
    loaded: data !== undefined,
    tagHref,
  };
};

/** Every tag in use, most used first: the suggestions for tag inputs. */
export const useTagSuggestions = () => {
  const { data } = useBookmarks();
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of data ?? []) {
      for (const tag of b.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [data]);
};

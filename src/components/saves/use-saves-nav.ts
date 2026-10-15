'use client';

import { Archive, House, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useBookmarks } from '@/features/saves/hooks';
import { useSavesStore } from '@/features/saves/store';
import type { SavesCategory } from '@/features/saves/types';

export const SAVES_CATEGORIES: Array<{ key: SavesCategory; label: string; Icon: typeof House }> = [
  { key: 'home', label: 'Home', Icon: House },
  { key: 'favorites', label: 'Favorites', Icon: Star },
  { key: 'archive', label: 'Archive', Icon: Archive },
];

/**
 * Category and tag navigation shared by the desktop sidebar and the mobile nav.
 * `tagFilter` comes from the route (/saves/tags/[tag]), which is the source of truth.
 */
export const useSavesNav = (tagFilter: string | null) => {
  const router = useRouter();
  const { data: bookmarks = [] } = useBookmarks();
  const category = useSavesStore((s) => s.category);
  const setCategory = useSavesStore((s) => s.setCategory);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookmarks) for (const t of b.tags) set.add(t);
    return [...set].sort();
  }, [bookmarks]);

  function selectCategory(key: SavesCategory) {
    // Leaving a tag view: the tag filter clears when the route changes to /saves.
    if (tagFilter) router.push('/saves');
    setCategory(key);
  }

  function selectTag(tag: string) {
    router.push(tagFilter === tag ? '/saves' : `/saves/tags/${encodeURIComponent(tag)}`);
  }

  return { category, tags, selectCategory, selectTag };
};

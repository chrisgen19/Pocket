'use client';

import { Archive, Hash, House, Star } from 'lucide-react';
import { useMemo } from 'react';
import { useSavesStore } from '@/features/saves/store';
import type { SavesCategory } from '@/features/saves/types';
import { cn } from '@/lib/utils';

const categories: Array<{ key: SavesCategory; label: string; Icon: typeof House }> = [
  { key: 'home', label: 'Home', Icon: House },
  { key: 'favorites', label: 'Favorites', Icon: Star },
  { key: 'archive', label: 'Archive', Icon: Archive },
];

export function Sidebar() {
  const bookmarks = useSavesStore((s) => s.bookmarks);
  const category = useSavesStore((s) => s.category);
  const tagFilter = useSavesStore((s) => s.tagFilter);
  const setCategory = useSavesStore((s) => s.setCategory);
  const setTagFilter = useSavesStore((s) => s.setTagFilter);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookmarks) {
      for (const t of b.tags) set.add(t);
    }
    return [...set].sort();
  }, [bookmarks]);

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 hidden md:block">
      <div className="sticky top-24">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          My List
        </h2>
        <nav className="space-y-1">
          {categories.map(({ key, label, Icon }) => {
            const active = !tagFilter && category === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={cn(
                  'group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  active
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 w-4 h-4',
                    active ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                  )}
                />
                {label}
              </button>
            );
          })}
        </nav>

        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-8 mb-3">
          Tags
        </h2>
        <nav className="space-y-1">
          {tags.length === 0 ? (
            <p className="text-sm text-gray-400 px-3 py-2 italic">No tags yet</p>
          ) : (
            tags.map((tag) => {
              const active = tagFilter === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(active ? null : tag)}
                  className={cn(
                    'group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <Hash
                    className={cn(
                      'mr-3 w-4 h-4',
                      active ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                    )}
                  />
                  <span className="truncate">{tag}</span>
                </button>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
}

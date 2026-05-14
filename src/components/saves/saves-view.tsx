'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSavesStore } from '@/features/saves/store';
import { useToastStore } from '@/features/saves/toast-store';
import { cn } from '@/lib/utils';
import { AddBookmarkForm, type AddBookmarkFormHandle } from './add-bookmark-form';
import { BookmarkCard } from './bookmark-card';
import { EmptyState } from './empty-state';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

function useEmptyCopy(category: string, tagFilter: string | null) {
  if (tagFilter) {
    return {
      title: `No saves tagged #${tagFilter}`,
      description: 'Try saving some items with this tag.',
    };
  }
  if (category === 'favorites') {
    return { title: 'No favorites yet', description: 'Click the star icon on a save to add it here.' };
  }
  if (category === 'archive') {
    return { title: 'Archive is empty', description: 'Items you archive will appear here.' };
  }
  return { title: 'No saves yet', description: 'Save articles, videos, and more from the web.' };
}

export function SavesView() {
  const formRef = useRef<AddBookmarkFormHandle>(null);

  // Avoid hydration mismatch: render after Zustand persist rehydrates.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const bookmarks = useSavesStore((s) => s.bookmarks);
  const view = useSavesStore((s) => s.view);
  const category = useSavesStore((s) => s.category);
  const tagFilter = useSavesStore((s) => s.tagFilter);
  const setView = useSavesStore((s) => s.setView);
  const deleteBookmark = useSavesStore((s) => s.deleteBookmark);
  const toggleFavorite = useSavesStore((s) => s.toggleFavorite);
  const toggleArchive = useSavesStore((s) => s.toggleArchive);
  const showToast = useToastStore((s) => s.show);

  const visible = useMemo(() => {
    let list = bookmarks;
    if (category === 'home') list = list.filter((b) => !b.isArchived);
    else if (category === 'favorites') list = list.filter((b) => b.isFavorite);
    else if (category === 'archive') list = list.filter((b) => b.isArchived);
    if (tagFilter) list = list.filter((b) => b.tags.includes(tagFilter));
    return list;
  }, [bookmarks, category, tagFilter]);

  const empty = useEmptyCopy(category, tagFilter);

  return (
    <>
      <Navbar onAddClick={() => formRef.current?.focus()} />

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col lg:flex-row gap-8">
        <Sidebar />

        <main className="flex-grow">
          <AddBookmarkForm ref={formRef} />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Saves</h1>
            <div className="flex items-center space-x-2 text-sm">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  view === 'grid' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-200',
                )}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  view === 'list' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-200',
                )}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!hydrated ? null : visible.length === 0 ? (
            <EmptyState title={empty.title} description={empty.description} />
          ) : (
            <div
              className={cn(
                view === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4',
              )}
            >
              {visible.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  view={view}
                  onToggleFavorite={(id) => {
                    toggleFavorite(id);
                    const b = bookmarks.find((x) => x.id === id);
                    showToast(!b?.isFavorite ? 'Added to Favorites' : 'Removed from Favorites');
                  }}
                  onToggleArchive={(id) => {
                    toggleArchive(id);
                    const b = bookmarks.find((x) => x.id === id);
                    showToast(!b?.isArchived ? 'Archived' : 'Unarchived');
                  }}
                  onDelete={(id) => {
                    deleteBookmark(id);
                    showToast('Item deleted');
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

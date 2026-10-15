'use client';

import { normalizeTag } from '@shared/tags';
import { LayoutGrid, List, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef } from 'react';
import { useBookmarks, useDeleteBookmark, useUpdateBookmark } from '@/features/saves/hooks';
import { useSavesStore } from '@/features/saves/store';
import type { SavesCategory } from '@/features/saves/types';
import { isApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { AddBookmarkForm, type AddBookmarkFormHandle } from './add-bookmark-form';
import { BookmarkCard } from './bookmark-card';
import { EmptyState } from './empty-state';
import { MobileNav } from './mobile-nav';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

function emptyCopy(category: string, tagFilter: string | null) {
  if (tagFilter)
    return {
      title: `No saves tagged #${tagFilter}`,
      description: 'Try saving some items with this tag.',
    };
  if (category === 'favorites')
    return {
      title: 'No favorites yet',
      description: 'Click the star icon on a save to add it here.',
    };
  if (category === 'archive')
    return { title: 'Archive is empty', description: 'Items you archive will appear here.' };
  return { title: 'No saves yet', description: 'Save articles, videos, and more from the web.' };
}

type SavesViewProps = {
  category?: SavesCategory;
  initialTag?: string;
};

// The route is the source of truth for both filters: /saves, /saves/favorites and
// /saves/archive set the category, /saves/tags/[tag] sets the tag (within Home, so
// archived saves stay out). Read from props during render, never synced into a store.
export function SavesView({ category = 'home', initialTag }: SavesViewProps = {}) {
  const router = useRouter();
  const formRef = useRef<AddBookmarkFormHandle>(null);

  const view = useSavesStore((s) => s.view);
  const setView = useSavesStore((s) => s.setView);

  const tagFilter = initialTag ?? null;

  function goToTag(tag: string) {
    router.push(`/saves/tags/${encodeURIComponent(tag)}`);
  }

  const bookmarksQuery = useBookmarks();
  const updateMutation = useUpdateBookmark();
  const deleteMutation = useDeleteBookmark();

  const bookmarks = bookmarksQuery.data ?? [];

  // Derive distinct tags from the already-loaded bookmarks. Avoids a separate
  // /api/tags request and naturally fails closed for unauthenticated users
  // (no bookmarks → no suggestions).
  const tagSuggestions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bookmarks) {
      for (const tag of b.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [bookmarks]);

  const visible = useMemo(() => {
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

  const empty = emptyCopy(category, tagFilter);
  const error = bookmarksQuery.error;
  const unauthorized = isApiError(error) && error.status === 401;

  return (
    <>
      <Navbar onAddClick={() => formRef.current?.focus()} />

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col lg:flex-row gap-8">
        <Sidebar category={category} tagFilter={tagFilter} />

        <main className="flex-grow">
          <MobileNav category={category} tagFilter={tagFilter} />
          <AddBookmarkForm ref={formRef} tagSuggestions={tagSuggestions} />

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

          {unauthorized ? (
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-gray-900">Sign in required</h3>
              <p className="mt-1 text-gray-500">Log in to view and save bookmarks.</p>
              <Link
                href="/login"
                className="inline-block mt-4 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
              >
                Go to login
              </Link>
            </div>
          ) : bookmarksQuery.isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
              <p className="mt-1 text-gray-500">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          ) : visible.length === 0 ? (
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
                  onToggleFavorite={(id) =>
                    updateMutation.mutate({ id, patch: { isFavorite: !bookmark.isFavorite } })
                  }
                  onToggleArchive={(id) =>
                    updateMutation.mutate({ id, patch: { isArchived: !bookmark.isArchived } })
                  }
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onTagClick={goToTag}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useBookmarks, useDeleteBookmark, useUpdateBookmark } from '@/features/saves/hooks';
import { useSavesStore } from '@/features/saves/store';
import type { SavesCategory } from '@/features/saves/types';
import { AddBookmarkForm, type AddBookmarkFormHandle } from './add-bookmark-form';
import type { BookmarkHandlers } from './bookmark-actions';
import { emptyCopyFor } from './empty-state';
import { MobileNav } from './mobile-nav';
import { Navbar } from './navbar';
import { SavesHeading } from './saves-heading';
import { SavesList } from './saves-list';
import { Sidebar } from './sidebar';
import { useTagSuggestions } from './use-saves-nav';
import { useVisibleBookmarks } from './use-visible-bookmarks';

const CATEGORY_TITLES: Record<SavesCategory, string> = {
  home: 'Home',
  favorites: 'Favorites',
  archive: 'Archive',
};

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

  const bookmarksQuery = useBookmarks();
  const updateMutation = useUpdateBookmark();
  const deleteMutation = useDeleteBookmark();
  const tagSuggestions = useTagSuggestions();

  const bookmarks = bookmarksQuery.data ?? [];
  const visible = useVisibleBookmarks(bookmarks, category, tagFilter);

  const handlers: BookmarkHandlers = {
    onToggleFavorite: (b) =>
      updateMutation.mutate({ id: b.id, patch: { isFavorite: !b.isFavorite } }),
    onToggleArchive: (b) =>
      updateMutation.mutate({ id: b.id, patch: { isArchived: !b.isArchived } }),
    onDelete: (b) => deleteMutation.mutate(b.id),
    onTagClick: (tag) => router.push(`/saves/tags/${encodeURIComponent(tag)}`),
  };

  return (
    <>
      <Navbar onAddClick={() => formRef.current?.focus()} />

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <Sidebar category={category} tagFilter={tagFilter} />

        <main className="min-w-0 flex-1">
          <MobileNav category={category} tagFilter={tagFilter} />
          <AddBookmarkForm ref={formRef} tagSuggestions={tagSuggestions} />
          <div className={view === 'list' ? 'max-w-[55rem]' : undefined}>
            <SavesHeading
              title={tagFilter ? `#${tagFilter}` : CATEGORY_TITLES[category]}
              count={bookmarksQuery.data ? visible.length : null}
              view={view}
              onViewChange={setView}
            />
            <SavesList
              query={bookmarksQuery}
              bookmarks={visible}
              view={view}
              handlers={handlers}
              empty={emptyCopyFor(category, tagFilter, bookmarks)}
            />
          </div>
        </main>
      </div>
    </>
  );
}

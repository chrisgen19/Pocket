'use client';

import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useState } from 'react';
import {
  useBookmarks,
  useDeleteBookmark,
  useSaveLinks,
  useUpdateBookmark,
} from '@/features/saves/hooks';
import { classifyInput, searchQueryFor } from '@/features/saves/omnibox';
import { useSaveQueueStore } from '@/features/saves/save-queue-store';
import { useSavesStore } from '@/features/saves/store';
import type { SavesCategory } from '@/features/saves/types';
import type { BookmarkHandlers } from './bookmark-actions';
import { emptyCopyFor, searchEmptyCopy } from './empty-state';
import { MobileNav } from './mobile-nav';
import { SavesHeading } from './saves-heading';
import { SavesList } from './saves-list';
import { Sidebar } from './sidebar';
import { splitPendingSaves, useVisibleBookmarks } from './use-visible-bookmarks';

const CATEGORY_TITLES: Record<SavesCategory, string> = {
  home: 'Home',
  favorites: 'Favorites',
  archive: 'Archive',
};

const sameTags = (a: string[], b: string[]) =>
  a.length === b.length && a.every((t, i) => t === b[i]);

type SavesViewProps = {
  category?: SavesCategory;
  initialTag?: string;
};

// The route is the source of truth for both filters: /saves, /saves/favorites and
// /saves/archive set the category, /saves/tags/[tag] sets the tag (within Home, so
// archived saves stay out). Read from props during render, never synced into a store.
// The header box (in src/app/saves/layout.tsx) adds a search on top via the store draft.
export function SavesView({ category = 'home', initialTag }: SavesViewProps = {}) {
  const router = useRouter();
  const view = useSavesStore((s) => s.view);
  const setView = useSavesStore((s) => s.setView);
  const draft = useSavesStore((s) => s.draft);
  const setDraft = useSavesStore((s) => s.setDraft);
  const queueItems = useSaveQueueStore((s) => s.items);
  const [editingId, setEditingId] = useState<string | null>(null);
  const tagFilter = initialTag ?? null;

  const bookmarksQuery = useBookmarks();
  const updateMutation = useUpdateBookmark();
  const deleteMutation = useDeleteBookmark();
  const { retry, dismiss } = useSaveLinks();
  const bookmarks = bookmarksQuery.data ?? [];

  // Several pasted links aren't a search; one link filters, showing it if already saved.
  // Typing filters with a deferred value so input stays responsive; clearing the box
  // (Enter, Esc, Clear) applies at once, so the list never lags behind an empty box.
  const deferred = useDeferredValue(draft);
  const deferredDraft = draft === '' ? '' : deferred;
  const intent = classifyInput(deferredDraft);
  const query = searchQueryFor(deferredDraft, intent);

  const visible = useVisibleBookmarks(bookmarks, category, tagFilter, query);
  const savedElsewhere =
    intent.kind === 'link' ? bookmarks.find((b) => b.url === intent.url) : undefined;
  const { pending, busyUrls } = splitPendingSaves(queueItems, bookmarks, query);

  // Tell the save queue what's on screen, so a result that can't show here gets a toast.
  const searching = query !== '';
  useEffect(() => {
    useSaveQueueStore.setState({ view: { category, tagFilter, searching } });
    return () => useSaveQueueStore.setState({ view: null });
  }, [category, tagFilter, searching]);

  const handlers: BookmarkHandlers = {
    onToggleFavorite: (b) =>
      updateMutation.mutate({ id: b.id, patch: { isFavorite: !b.isFavorite } }),
    onToggleArchive: (b) =>
      updateMutation.mutate({ id: b.id, patch: { isArchived: !b.isArchived } }),
    onDelete: (b) => deleteMutation.mutate(b.id),
    onTagClick: (tag) => router.push(`/saves/tags/${encodeURIComponent(tag)}`),
    onEditTags: (b) => setEditingId(b.id),
    onSaveTags: (b, tags) => {
      setEditingId(null);
      if (!sameTags(tags, b.tags)) updateMutation.mutate({ id: b.id, patch: { tags } });
    },
    onCancelEditTags: () => setEditingId(null),
  };

  const viewTitle = tagFilter ? `#${tagFilter}` : CATEGORY_TITLES[category];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <Sidebar category={category} tagFilter={tagFilter} />

      <main className="min-w-0 flex-1">
        <MobileNav category={category} tagFilter={tagFilter} />
        <div className={view === 'list' ? 'max-w-[55rem]' : undefined}>
          <SavesHeading
            title={query ? `Results for “${query}”` : viewTitle}
            count={bookmarksQuery.data ? visible.length : null}
            view={view}
            onViewChange={setView}
            onClearSearch={query ? () => setDraft('') : undefined}
          />
          <SavesList
            query={bookmarksQuery}
            bookmarks={visible}
            view={view}
            handlers={handlers}
            empty={
              query
                ? searchEmptyCopy(query, intent, savedElsewhere, () => setDraft(''))
                : emptyCopyFor(category, tagFilter, bookmarks)
            }
            pending={pending}
            onRetry={retry}
            onDismiss={dismiss}
            busyUrls={busyUrls}
            editingId={editingId}
          />
        </div>
      </main>
    </div>
  );
}

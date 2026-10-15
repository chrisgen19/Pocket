'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import type { PendingSave } from '@/features/saves/save-queue-store';
import type { Bookmark, SavesView } from '@/features/saves/types';
import { isApiError } from '@/lib/api-error';
import type { BookmarkHandlers } from './bookmark-actions';
import { BookmarkRow } from './bookmark-row';
import { BookmarkTile } from './bookmark-tile';
import { type EmptyCopy, EmptyState } from './empty-state';
import { PendingSaveRow } from './pending-save-row';
import { SavesError, SavesSkeleton, SessionEnded } from './saves-states';

type SavesListProps = {
  query: UseQueryResult<Bookmark[]>;
  /** The saves to show, already filtered for the current view. */
  bookmarks: Bookmark[];
  view: SavesView;
  handlers: BookmarkHandlers;
  empty: EmptyCopy;
  /** New links being saved, shown first. */
  pending: PendingSave[];
  onRetry: (url: string) => void;
  onDismiss: (url: string) => void;
  /** Listed saves being saved again. */
  busyUrls: Set<string>;
  editingId: string | null;
};

/** The list or grid of saves, or the loading, error or empty state in its place. */
export function SavesList(props: SavesListProps) {
  const { query, bookmarks, view, handlers, pending, busyUrls, editingId } = props;

  if (isApiError(query.error) && query.error.status === 401) return <SessionEnded />;
  if (query.isPending) return <SavesSkeleton view={view} />;
  // A failed background refetch keeps showing the saves already loaded.
  if (query.error && !query.data) {
    return (
      <SavesError
        message={query.error.message}
        onRetry={() => query.refetch()}
        retrying={query.isFetching}
      />
    );
  }
  if (bookmarks.length === 0 && pending.length === 0) return <EmptyState {...props.empty} />;

  const pendingItems = pending.map((item) => (
    <li key={`pending:${item.url}`}>
      <PendingSaveRow item={item} onRetry={props.onRetry} onDismiss={props.onDismiss} />
    </li>
  ));

  if (view === 'grid') {
    return (
      <>
        {pendingItems.length > 0 && (
          <ul className="mb-4 divide-y overflow-hidden rounded-xl border bg-card">
            {pendingItems}
          </ul>
        )}
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id}>
              <BookmarkTile
                bookmark={bookmark}
                handlers={handlers}
                busy={busyUrls.has(bookmark.url)}
                editing={editingId === bookmark.id}
              />
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {pendingItems}
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id}>
          <BookmarkRow
            bookmark={bookmark}
            handlers={handlers}
            busy={busyUrls.has(bookmark.url)}
            editing={editingId === bookmark.id}
          />
        </li>
      ))}
    </ul>
  );
}

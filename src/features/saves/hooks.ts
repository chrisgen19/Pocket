'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { BOOKMARKS_KEY, insertByDate } from './cache';
import { dismissSave, enqueueSaves, retrySave } from './save-queue-runner';
import { useToastStore } from './toast-store';
import type { Bookmark, RestoreBookmarkInput, UpdateBookmarkInput } from './types';

export function useBookmarks() {
  return useQuery({ queryKey: BOOKMARKS_KEY, queryFn: api.listBookmarks });
}

/** Queue-backed saving: save several links at once, retry or dismiss a failed one. */
export function useSaveLinks() {
  const qc = useQueryClient();
  return {
    save: (urls: string[], tags: string[]) => enqueueSaves(qc, urls, tags),
    retry: (url: string) => retrySave(qc, url),
    dismiss: dismissSave,
  };
}

export function useUpdateBookmark() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBookmarkInput }) =>
      api.updateBookmark(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: BOOKMARKS_KEY });
      const previous = qc.getQueryData<Bookmark[]>(BOOKMARKS_KEY)?.find((b) => b.id === id);
      qc.setQueryData<Bookmark[]>(BOOKMARKS_KEY, (prev) =>
        prev?.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      );
      return { previous };
    },
    // Revert only this row: restoring a whole-list snapshot would also drop saves the
    // queue added while the request was in flight.
    onError: (err, { id }, ctx) => {
      const previous = ctx?.previous;
      if (previous) {
        qc.setQueryData<Bookmark[]>(BOOKMARKS_KEY, (prev) =>
          prev?.map((b) => (b.id === id ? previous : b)),
        );
      }
      showToast(err instanceof Error ? err.message : 'Update failed');
    },
    onSuccess: (updated, { patch }) => {
      qc.setQueryData<Bookmark[]>(BOOKMARKS_KEY, (prev) =>
        prev?.map((b) => (b.id === updated.id ? updated : b)),
      );
      if (patch.tags !== undefined) {
        showToast('Tags saved');
      } else if (patch.isFavorite !== undefined) {
        showToast(updated.isFavorite ? 'Added to Favorites' : 'Removed from Favorites');
      } else if (patch.isArchived !== undefined) {
        showToast(updated.isArchived ? 'Archived' : 'Unarchived');
      }
    },
  });
}

export function useDeleteBookmark() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const restore = useRestoreBookmark();
  return useMutation({
    mutationFn: (id: string) => api.deleteBookmark(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: BOOKMARKS_KEY });
      const removed = qc.getQueryData<Bookmark[]>(BOOKMARKS_KEY)?.find((b) => b.id === id);
      qc.setQueryData<Bookmark[]>(BOOKMARKS_KEY, (prev) => prev?.filter((b) => b.id !== id));
      return { removed };
    },
    // Put just this row back (see useUpdateBookmark).
    onError: (err, _id, ctx) => {
      const removed = ctx?.removed;
      if (removed) {
        qc.setQueryData<Bookmark[]>(BOOKMARKS_KEY, (prev) => prev && insertByDate(prev, removed));
      }
      showToast(err instanceof Error ? err.message : 'Delete failed');
    },
    // The delete is real; Undo re-inserts the returned row via /api/bookmarks/restore.
    onSuccess: (deleted) =>
      showToast('Deleted', { label: 'Undo', onAction: () => restore.mutate(deleted) }),
  });
}

export function useRestoreBookmark() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: (input: RestoreBookmarkInput) => api.restoreBookmark(input),
    onSuccess: (restored) => {
      // Back into its original slot: the list is ordered newest first by dateAdded.
      qc.setQueryData<Bookmark[]>(BOOKMARKS_KEY, (list = []) => insertByDate(list, restored));
      showToast('Restored');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Restore failed'),
  });
}

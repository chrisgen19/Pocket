'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from './toast-store';
import * as api from './api';
import type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from './types';

const KEY = ['bookmarks'] as const;

export function useBookmarks() {
  return useQuery({ queryKey: KEY, queryFn: api.listBookmarks });
}

export function useCreateBookmark() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: (input: CreateBookmarkInput) => api.createBookmark(input),
    onSuccess: (bookmark) => {
      // Re-saving an existing URL upserts and returns the same id, so replace
      // that entry in place (the list is ordered by createdAt, which an upsert
      // keeps) instead of prepending a duplicate.
      const prev = qc.getQueryData<Bookmark[]>(KEY);
      const exists = prev?.some((b) => b.id === bookmark.id) ?? false;
      qc.setQueryData<Bookmark[]>(KEY, (list = []) =>
        exists ? list.map((b) => (b.id === bookmark.id ? bookmark : b)) : [bookmark, ...list],
      );
      showToast(exists ? 'Already saved, updated' : 'URL saved');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Failed to save URL'),
  });
}

export function useUpdateBookmark() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBookmarkInput }) =>
      api.updateBookmark(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Bookmark[]>(KEY);
      qc.setQueryData<Bookmark[]>(KEY, (prev) =>
        prev?.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
      showToast(err instanceof Error ? err.message : 'Update failed');
    },
    onSuccess: (updated, { patch }) => {
      qc.setQueryData<Bookmark[]>(KEY, (prev) =>
        prev?.map((b) => (b.id === updated.id ? updated : b)),
      );
      if (patch.isFavorite !== undefined) {
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
  return useMutation({
    mutationFn: (id: string) => api.deleteBookmark(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Bookmark[]>(KEY);
      qc.setQueryData<Bookmark[]>(KEY, (prev) => prev?.filter((b) => b.id !== id));
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
      showToast(err instanceof Error ? err.message : 'Delete failed');
    },
    onSuccess: () => showToast('Item deleted'),
  });
}

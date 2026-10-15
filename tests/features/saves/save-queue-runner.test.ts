import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/features/saves/api';
import { enqueueSaves, resetSaveQueue } from '@/features/saves/save-queue-runner';
import { useSaveQueueStore } from '@/features/saves/save-queue-store';
import type { Bookmark } from '@/features/saves/types';
import { ApiError } from '@/lib/api-error';

vi.mock('@/features/saves/api', () => ({ createBookmark: vi.fn() }));

const createBookmark = vi.mocked(api.createBookmark);
const urls = (count: number) => Array.from({ length: count }, (_, i) => `https://site${i}.com`);
const announcement = () => useSaveQueueStore.getState().announcement?.text;

afterEach(() => {
  resetSaveQueue();
  createBookmark.mockReset();
});

describe('save queue batch summary', () => {
  it('counts every link when the session ends mid-batch, including ones still queued', async () => {
    createBookmark.mockRejectedValue(new ApiError(401, 'Unauthorized'));
    enqueueSaves(new QueryClient(), urls(8), []);

    await vi.waitFor(() => expect(announcement()).toBe("Couldn't save 8 links"));
    const { items } = useSaveQueueStore.getState();
    expect(items).toHaveLength(8);
    expect(items.every((i) => i.status === 'error')).toBe(true);
    // Only the first three ever reached the server (the concurrency limit).
    expect(createBookmark).toHaveBeenCalledTimes(3);
  });

  it('reports a batch that saved everything', async () => {
    createBookmark.mockImplementation(async ({ url }) => ({
      bookmark: { id: url, url, dateAdded: Date.now(), tags: [] } as unknown as Bookmark,
      created: true,
    }));
    enqueueSaves(new QueryClient(), urls(5), []);

    await vi.waitFor(() => expect(announcement()).toBe('Saved 5 links'));
    expect(useSaveQueueStore.getState().items).toEqual([]);
  });
});

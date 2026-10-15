'use client';

import { create } from 'zustand';

/** A link waiting to be saved, being saved, or whose save failed. */
export type PendingSave = {
  /** The URL as the server stores it, so one link is never queued twice. */
  url: string;
  tags: string[];
  status: 'queued' | 'saving' | 'error';
  error?: string;
  /** False for errors retrying can't fix, e.g. a link the server refuses to fetch. */
  retryable: boolean;
};

type SaveQueueState = {
  items: PendingSave[];
  /** Bumped by reset(); results of saves started before it are ignored. */
  epoch: number;
  /** Latest screen reader announcement; the id makes a repeated message re-announce. */
  announcement: { id: number; text: string } | null;
};

/**
 * Pending saves, kept outside React so they survive navigating between saves views.
 * Read with a selector returning `s.items` (not a filtered copy) and derive in render.
 * Changes go through src/features/saves/save-queue-runner.ts.
 */
export const useSaveQueueStore = create<SaveQueueState>(() => ({
  items: [],
  epoch: 0,
  announcement: null,
}));

/** True while anything is queued or saving. */
export const isQueueActive = (items: PendingSave[]): boolean =>
  items.some((item) => item.status !== 'error');

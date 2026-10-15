'use client';

import { normalizeTag } from '@shared/tags';
import { create } from 'zustand';
import type { SavesCategory } from './types';

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

/** The saves view on screen, so the runner knows whether a result is visible there. */
export type QueueView = { category: SavesCategory; tagFilter: string | null; searching: boolean };

type SaveQueueState = {
  items: PendingSave[];
  /** Set by SavesView while mounted; null on other pages. */
  view: QueueView | null;
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
  view: null,
  epoch: 0,
  announcement: null,
}));

/** Pending and failed rows show in every saves view, except while searching. */
export const showsPendingRows = (view: QueueView | null): boolean =>
  view !== null && !view.searching;

/**
 * Whether a newly saved link (always in Home, never archived or a favorite) is listed in
 * this view once saved: Home, or a tag view it's tagged for, and not while searching.
 */
export const listsNewSave = (view: QueueView | null, tags: string[]): boolean =>
  showsPendingRows(view) &&
  view?.category === 'home' &&
  (!view.tagFilter || tags.includes(normalizeTag(view.tagFilter)));

/** True while anything is queued or saving. */
export const isQueueActive = (items: PendingSave[]): boolean =>
  items.some((item) => item.status !== 'error');

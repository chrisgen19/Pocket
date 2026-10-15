'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavesView } from './types';

// UI state only. The category and tag filter live in the route.
type SavesUIState = {
  view: SavesView;
  setView: (v: SavesView) => void;
  /**
   * Text in the header box: a search query or link(s) to save. Kept here (not
   * persisted) so it survives moving between saves views and the list can filter on it.
   */
  draft: string;
  setDraft: (draft: string) => void;
};

export const useSavesStore = create<SavesUIState>()(
  persist(
    (set) => ({
      view: 'list',
      setView: (v) => set({ view: v }),
      draft: '',
      setDraft: (draft) => set({ draft }),
    }),
    {
      name: 'pocket-saves-ui',
      version: 2,
      partialize: (state) => ({ view: state.view }),
    },
  ),
);

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavesView } from './types';

// UI preferences only. The category and tag filter live in the route.
type SavesUIState = {
  view: SavesView;
  setView: (v: SavesView) => void;
};

export const useSavesStore = create<SavesUIState>()(
  persist(
    (set) => ({
      view: 'grid',
      setView: (v) => set({ view: v }),
    }),
    {
      name: 'pocket-saves-ui',
      version: 2,
      partialize: (state) => ({ view: state.view }),
    },
  ),
);

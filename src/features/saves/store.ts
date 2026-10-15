'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavesCategory, SavesView } from './types';

type SavesUIState = {
  view: SavesView;
  category: SavesCategory;
  setView: (v: SavesView) => void;
  setCategory: (c: SavesCategory) => void;
};

export const useSavesStore = create<SavesUIState>()(
  persist(
    (set) => ({
      view: 'grid',
      category: 'home',
      setView: (v) => set({ view: v }),
      setCategory: (c) => set({ category: c }),
    }),
    {
      name: 'pocket-saves-ui',
      version: 2,
      partialize: (state) => ({ view: state.view }),
    },
  ),
);

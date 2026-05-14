'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavesCategory, SavesView } from './types';

type SavesUIState = {
  view: SavesView;
  category: SavesCategory;
  tagFilter: string | null;
  setView: (v: SavesView) => void;
  setCategory: (c: SavesCategory) => void;
  setTagFilter: (t: string | null) => void;
};

export const useSavesStore = create<SavesUIState>()(
  persist(
    (set) => ({
      view: 'grid',
      category: 'home',
      tagFilter: null,
      setView: (v) => set({ view: v }),
      setCategory: (c) => set({ category: c, tagFilter: null }),
      setTagFilter: (t) => set({ tagFilter: t }),
    }),
    {
      name: 'pocket-saves-ui',
      version: 2,
      partialize: (state) => ({ view: state.view }),
    },
  ),
);

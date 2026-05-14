'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bookmark, SavesCategory, SavesView } from './types';
import { extractDomain, generateId, placeholderImage } from './utils';

type NewBookmarkInput = {
  url: string;
  tags: string[];
};

type SavesState = {
  bookmarks: Bookmark[];
  view: SavesView;
  category: SavesCategory;
  tagFilter: string | null;
  setView: (v: SavesView) => void;
  setCategory: (c: SavesCategory) => void;
  setTagFilter: (t: string | null) => void;
  addBookmark: (input: NewBookmarkInput) => Bookmark;
  deleteBookmark: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;
};

const seed: Bookmark[] = [
  {
    id: 'seed-1',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    title: 'JavaScript | MDN',
    domain: 'developer.mozilla.org',
    excerpt:
      'JavaScript (JS) is a lightweight, interpreted, or just-in-time compiled programming language with first-class functions.',
    imageUrl: 'https://developer.mozilla.org/mdn-social-share.cd6c4a5a.png',
    dateAdded: Date.now() - 86_400_000,
    tags: ['javascript', 'programming', 'docs'],
    isFavorite: false,
    isArchived: false,
  },
  {
    id: 'seed-2',
    url: 'https://tailwindcss.com/docs',
    title: 'Tailwind CSS Documentation',
    domain: 'tailwindcss.com',
    excerpt:
      'Rapidly build modern websites without ever leaving your HTML. A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90.',
    imageUrl: 'https://tailwindcss.com/_next/static/media/social-square.b622e290.jpg',
    dateAdded: Date.now() - 172_800_000,
    tags: ['css', 'tailwind', 'design'],
    isFavorite: false,
    isArchived: false,
  },
];

export const useSavesStore = create<SavesState>()(
  persist(
    (set) => ({
      bookmarks: seed,
      view: 'grid',
      category: 'home',
      tagFilter: null,
      setView: (v) => set({ view: v }),
      setCategory: (c) => set({ category: c, tagFilter: null }),
      setTagFilter: (t) => set({ tagFilter: t }),
      addBookmark: ({ url, tags }) => {
        const domain = extractDomain(url);
        const bookmark: Bookmark = {
          id: generateId(),
          url,
          title: `Saved from ${domain}`,
          domain,
          excerpt:
            'Description or excerpt from the page would appear here once metadata fetching is wired up.',
          imageUrl: placeholderImage(url, domain),
          dateAdded: Date.now(),
          tags,
          isFavorite: false,
          isArchived: false,
        };
        set((state) => ({
          bookmarks: [bookmark, ...state.bookmarks],
          category: 'home',
          tagFilter: null,
        }));
        return bookmark;
      },
      deleteBookmark: (id) =>
        set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) })),
      toggleFavorite: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, isFavorite: !b.isFavorite } : b,
          ),
        })),
      toggleArchive: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, isArchived: !b.isArchived } : b,
          ),
        })),
    }),
    {
      name: 'pocket-saves',
      version: 1,
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        view: state.view,
      }),
    },
  ),
);

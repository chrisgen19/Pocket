import type { Bookmark } from './types';

// Bookmarks are replaced (not mutated) on every update, so a cached string can't go stale.
const haystacks = new WeakMap<Bookmark, string>();

const haystackFor = (bookmark: Bookmark): string => {
  let text = haystacks.get(bookmark);
  if (text === undefined) {
    text = [
      bookmark.title,
      bookmark.domain,
      bookmark.url,
      bookmark.excerpt,
      ...bookmark.tags.map((tag) => `#${tag}`),
    ]
      .join('\n')
      .toLowerCase();
    haystacks.set(bookmark, text);
  }
  return text;
};

/** Lowercased words of a search query. */
export const searchTerms = (query: string): string[] =>
  query.toLowerCase().split(/\s+/).filter(Boolean);

/** True when every term appears in the title, domain, link, excerpt or tags. */
export const matchesSearch = (bookmark: Bookmark, terms: string[]): boolean => {
  if (terms.length === 0) return true;
  const text = haystackFor(bookmark);
  return terms.every((term) => text.includes(term));
};

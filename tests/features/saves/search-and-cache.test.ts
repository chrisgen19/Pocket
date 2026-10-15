import { describe, expect, it } from 'vitest';
import { insertByDate } from '@/features/saves/cache';
import { matchesSearch, searchTerms } from '@/features/saves/search';
import type { Bookmark } from '@/features/saves/types';

const bookmark = (overrides: Partial<Bookmark>): Bookmark => ({
  id: 'id',
  url: 'https://example.com/',
  title: 'Example Domain',
  domain: 'example.com',
  excerpt: '',
  imageUrl: '',
  dateAdded: 0,
  tags: [],
  isFavorite: false,
  isArchived: false,
  ...overrides,
});

describe('matchesSearch', () => {
  const save = bookmark({
    title: 'How To Center a Div',
    domain: 'joshwcomeau.com',
    url: 'https://www.joshwcomeau.com/css/center-a-div/',
    excerpt: 'Back in the day, centering an element was tricky.',
    tags: ['css', 'design'],
  });

  it('matches when every word appears somewhere, in any case', () => {
    expect(matchesSearch(save, searchTerms('CENTER comeau'))).toBe(true);
    expect(matchesSearch(save, searchTerms('tricky element'))).toBe(true);
  });

  it('matches tags, with or without the #', () => {
    expect(matchesSearch(save, searchTerms('#design'))).toBe(true);
    expect(matchesSearch(save, searchTerms('design'))).toBe(true);
  });

  it('fails when any word is missing', () => {
    expect(matchesSearch(save, searchTerms('center flexbox'))).toBe(false);
  });

  it('matches everything for an empty query', () => {
    expect(matchesSearch(save, searchTerms('   '))).toBe(true);
  });
});

describe('insertByDate', () => {
  const older = bookmark({ id: 'older', dateAdded: 1 });
  const newer = bookmark({ id: 'newer', dateAdded: 3 });

  it('keeps the list newest first', () => {
    const middle = bookmark({ id: 'middle', dateAdded: 2 });
    expect(insertByDate([newer, older], middle).map((b) => b.id)).toEqual([
      'newer',
      'middle',
      'older',
    ]);
  });

  it('puts the newest save on top and the oldest at the end', () => {
    expect(insertByDate([older], newer).map((b) => b.id)).toEqual(['newer', 'older']);
    expect(insertByDate([newer], older).map((b) => b.id)).toEqual(['newer', 'older']);
  });

  it('replaces an entry with the same id instead of duplicating it', () => {
    const renamed = { ...older, title: 'Renamed' };
    const list = insertByDate([newer, older], renamed);
    expect(list).toHaveLength(2);
    expect(list[1].title).toBe('Renamed');
  });
});

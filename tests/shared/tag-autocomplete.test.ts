import { filterSuggestions, rankedSuggestions } from '@shared/tag-autocomplete';
import { describe, expect, it } from 'vitest';

describe('filterSuggestions', () => {
  const ALL = ['design', 'reading', 'dns', 'reference', 'networking', 'longform-articles'];

  it('matches the token being typed as a case-insensitive substring', () => {
    expect(filterSuggestions(ALL, 're', 're', 8)).toEqual(['reading', 'reference']);
    expect(filterSuggestions(ALL, 'RE', 'RE', 8)).toEqual(['reading', 'reference']);
    expect(filterSuggestions(ALL, 'ing', 'ing', 8)).toEqual(['reading', 'networking']);
  });

  it('excludes tags already in the input', () => {
    expect(filterSuggestions(ALL, 'd', 'reference, d', 8)).toEqual(['design', 'reading', 'dns']);
    expect(filterSuggestions(ALL, '', 'design, dns, ', 8)).toEqual([
      'reading',
      'reference',
      'networking',
      'longform-articles',
    ]);
  });

  it('treats used tags case-insensitively', () => {
    expect(filterSuggestions(ALL, 'de', 'DESIGN, de', 8)).toEqual([]);
  });

  it('keeps an exact match for the token being typed', () => {
    // "design" is in the input only because it is the token being typed.
    expect(filterSuggestions(ALL, 'design', 'design', 8)).toEqual(['design']);
  });

  it('shows everything unused for an empty token, up to the limit', () => {
    expect(filterSuggestions(ALL, '', '', 8)).toEqual(ALL);
    expect(filterSuggestions(ALL, '', '', 3)).toEqual(['design', 'reading', 'dns']);
  });

  it('keeps the order of the suggestion list', () => {
    expect(filterSuggestions(['reference', 'reading'], 're', 're', 8)).toEqual([
      'reference',
      'reading',
    ]);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterSuggestions(ALL, 'zzz', 'zzz', 8)).toEqual([]);
    expect(filterSuggestions([], 're', 're', 8)).toEqual([]);
  });
});

describe('rankedSuggestions', () => {
  const ALL = ['design-systems', 'web-design', 'design', 'reading', 'dns'];

  it('puts an exact match first, then prefix matches, then the rest', () => {
    expect(rankedSuggestions(ALL, 'design', [], 8)).toEqual([
      'design',
      'design-systems',
      'web-design',
    ]);
  });

  it('leaves out tags already chosen', () => {
    expect(rankedSuggestions(ALL, 'design', ['design'], 8)).toEqual([
      'design-systems',
      'web-design',
    ]);
  });

  it('suggests everything not chosen yet when nothing is typed, up to the limit', () => {
    expect(rankedSuggestions(ALL, '', ['reading'], 3)).toEqual([
      'design-systems',
      'web-design',
      'design',
    ]);
  });

  it('ranks before applying the limit, so an exact match is never cut off', () => {
    expect(rankedSuggestions(ALL, 'design', [], 1)).toEqual(['design']);
  });
});

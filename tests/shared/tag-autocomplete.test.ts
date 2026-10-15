import { filterSuggestions, splitAtCursor } from '@shared/tag-autocomplete';
import { describe, expect, it } from 'vitest';

describe('splitAtCursor', () => {
  it.each([
    ['', { before: '', current: '' }],
    ['re', { before: '', current: 're' }],
    ['  re', { before: '', current: 're' }],
    ['design,', { before: 'design, ', current: '' }],
    ['design, ', { before: 'design, ', current: '' }],
    ['design,re', { before: 'design, ', current: 're' }],
    ['design, re', { before: 'design, ', current: 're' }],
    ['design,  re ', { before: 'design, ', current: 're' }],
    ['a, b, c', { before: 'a, b, ', current: 'c' }],
  ])('%j', (value, expected) => {
    expect(splitAtCursor(value)).toEqual(expected);
  });

  it('appending a suggestion to `before` gives the committed value', () => {
    const { before } = splitAtCursor('design,re');
    expect(`${before}reading, `).toBe('design, reading, ');
  });
});

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

describe('picking a second tag (regression)', () => {
  it('keeps the space after the previous tag', () => {
    // Used to produce "reference,design, ": the space after the comma was dropped.
    const { before } = splitAtCursor('reference, d');
    expect(`${before}design, `).toBe('reference, design, ');
  });
});

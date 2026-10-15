import { normalizeTag, normalizeTags } from '@shared/tags';
import { describe, expect, it } from 'vitest';

describe('normalizeTag', () => {
  it.each([
    ['Design', 'design'],
    ['  design  ', 'design'],
    ['DESIGN', 'design'],
    [' nbsp ', 'nbsp'],
    ['　Ideographic　', 'ideographic'],
    ['\ttab\n', 'tab'],
    ['Café', 'café'],
    ['Machine  Learning', 'machine  learning'],
    ['', ''],
    ['   ', ''],
  ])('%j -> %j', (input, expected) => {
    expect(normalizeTag(input)).toBe(expected);
  });
});

describe('normalizeTags', () => {
  it('trims, lowercases and dedupes case variants into one tag', () => {
    expect(normalizeTags(['Design', ' design', 'DESIGN ', 'Reading'])).toEqual([
      'design',
      'reading',
    ]);
  });

  it('keeps the first-seen order', () => {
    expect(normalizeTags(['zeta', 'Alpha', 'zeta', 'ALPHA', 'beta'])).toEqual([
      'zeta',
      'alpha',
      'beta',
    ]);
  });

  it('drops empty and whitespace-only tags', () => {
    expect(normalizeTags(['', '  ', '\t', ' ', 'x'])).toEqual(['x']);
  });

  it('keeps inner whitespace, so different spacing stays different', () => {
    expect(normalizeTags(['Machine  Learning', 'machine learning'])).toEqual([
      'machine  learning',
      'machine learning',
    ]);
  });

  it('returns an empty array for no tags', () => {
    expect(normalizeTags([])).toEqual([]);
  });

  it('is idempotent', () => {
    const once = normalizeTags([' Design ', 'Café', 'CAFÉ', 'go']);
    expect(normalizeTags(once)).toEqual(once);
  });
});

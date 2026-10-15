import { describe, expect, it } from 'vitest';
import {
  classifyInput,
  displayUrl,
  extractLinks,
  MAX_LINKS,
  searchQueryFor,
} from '@/features/saves/omnibox';

describe('classifyInput', () => {
  it.each(['', '   '])('treats %j as empty', (input) => {
    expect(classifyInput(input)).toEqual({ kind: 'empty' });
  });

  it.each([
    'figma',
    'react hooks',
    'e.g.',
    'react.dev hooks',
    '#design',
  ])('searches for %j', (input) => {
    expect(classifyInput(input)).toEqual({ kind: 'search', query: input.trim() });
  });

  it.each([
    ['zed.dev/blog', 'https://zed.dev/blog'],
    ['  https://zed.dev  ', 'https://zed.dev'],
    ['localhost:3000', 'https://localhost:3000'],
    ['127.0.0.1:8080/x', 'https://127.0.0.1:8080/x'],
    // Pasted from prose: wrapping punctuation goes, a balanced ")" in the URL stays.
    ['(https://a.com).', 'https://a.com'],
    ['https://en.wikipedia.org/wiki/Foo_(bar)', 'https://en.wikipedia.org/wiki/Foo_(bar)'],
    // Dotted words look like hosts; the list still filters on the raw text for these.
    ['next.js', 'https://next.js'],
  ])('reads %j as one link', (input, url) => {
    expect(classifyInput(input)).toEqual({ kind: 'link', url });
  });

  it('dedupes repeated links down to one', () => {
    expect(classifyInput('a.com a.com')).toEqual({ kind: 'link', url: 'https://a.com' });
  });

  it('reads several links, keeping their order', () => {
    expect(classifyInput('a.com\nhttps://b.com/x c.org')).toEqual({
      kind: 'links',
      urls: ['https://a.com', 'https://b.com/x', 'https://c.org'],
      skipped: [],
      overLimit: 0,
    });
  });

  it.each([
    'https://example.com/?next=https://other.com',
    'https://www.google.com/url?q=https://example.com/a&sa=D',
    'https://web.archive.org/web/2020/https://example.com/',
    'https://example.com/#from=http://other.com',
  ])('keeps the URL embedded in %j as part of one link', (input) => {
    expect(classifyInput(input)).toEqual({ kind: 'link', url: input });
    expect(extractLinks(`see ${input} here`)).toEqual([input]);
  });

  it('splits links pasted back to back without a separator', () => {
    expect(classifyInput('https://a.comhttps://b.com')).toEqual({
      kind: 'links',
      urls: ['https://a.com', 'https://b.com'],
      skipped: [],
      overLimit: 0,
    });
  });

  it(`caps a pasted list at ${MAX_LINKS} links and reports how many were left out`, () => {
    const text = Array.from({ length: MAX_LINKS + 5 }, (_, i) => `site${i}.com`).join(' ');
    const intent = classifyInput(text);
    expect(intent.kind).toBe('links');
    if (intent.kind === 'links') {
      expect(intent.urls).toHaveLength(MAX_LINKS);
      expect(intent.overLimit).toBe(5);
    }
  });

  it('reports incomplete entries in a pasted list instead of dropping them silently', () => {
    expect(classifyInput('https://a.com https:// b.com')).toEqual({
      kind: 'links',
      urls: ['https://a.com', 'https://b.com'],
      skipped: ['https://'],
      overLimit: 0,
    });
    // One good link plus a bad one is still a list, so the panel can show what's skipped.
    expect(classifyInput('https://a.com https://')).toEqual({
      kind: 'links',
      urls: ['https://a.com'],
      skipped: ['https://'],
      overLimit: 0,
    });
  });

  it('flags a list where no entry is a complete address', () => {
    expect(classifyInput('https:// http://').kind).toBe('invalid');
  });

  it.each([
    'ftp://example.com',
    'javascript:alert(1)',
    'mailto:a@b.com',
    'file:///etc/hosts',
  ])('explains that %j cannot be saved', (input) => {
    expect(classifyInput(input)).toEqual({
      kind: 'invalid',
      message: 'Only web links (http or https) can be saved.',
    });
  });

  it('flags an http(s) prefix with no address', () => {
    expect(classifyInput('https://').kind).toBe('invalid');
  });
});

describe('extractLinks', () => {
  it('takes only scheme links from prose, so "Next.js" is not a link', () => {
    expect(extractLinks('See https://a.com/x, built with Next.js.')).toEqual(['https://a.com/x']);
  });

  it('takes bare domains when the text is nothing but links', () => {
    expect(extractLinks('a.com\nb.com/path\n')).toEqual(['https://a.com', 'https://b.com/path']);
  });

  it(`keeps links past ${MAX_LINKS}, so the classifier can report what it leaves out`, () => {
    const pasted = Array.from({ length: MAX_LINKS + 10 }, (_, i) => `https://site${i}.com`);
    const links = extractLinks(pasted.join('\n'));
    expect(links).toHaveLength(MAX_LINKS + 10);
    const intent = classifyInput(links.join(' '));
    expect(intent.kind === 'links' && intent.overLimit).toBe(10);
  });

  it('returns nothing for text without links', () => {
    expect(extractLinks('just some words')).toEqual([]);
    expect(extractLinks('')).toEqual([]);
  });
});

describe('displayUrl', () => {
  it.each([
    ['https://www.zed.dev/blog/', 'zed.dev/blog'],
    ['http://example.com', 'example.com'],
    ['https://a.com/x?q=1', 'a.com/x?q=1'],
  ])('shortens %j to %j', (url, expected) => {
    expect(displayUrl(url)).toBe(expected);
  });
});

describe('searchQueryFor', () => {
  const query = (raw: string) => searchQueryFor(raw, classifyInput(raw));

  it('searches for typed words as they are', () => {
    expect(query('  react hooks ')).toBe('react hooks');
  });

  it('searches for a link without the punctuation around it', () => {
    expect(query('(https://a.com).')).toBe('https://a.com');
    expect(query('"zed.dev/blog",')).toBe('zed.dev/blog');
  });

  it('keeps a dotted word as typed, so "next.js" still matches titles', () => {
    expect(query('next.js')).toBe('next.js');
  });

  it('does not search while the box holds several links or nothing', () => {
    expect(query('a.com b.com')).toBe('');
    expect(query('   ')).toBe('');
  });
});

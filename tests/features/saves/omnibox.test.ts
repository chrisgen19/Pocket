import { describe, expect, it } from 'vitest';
import { classifyInput, displayUrl, extractLinks, MAX_LINKS } from '@/features/saves/omnibox';

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
    });
  });

  it('splits links pasted back to back without a separator', () => {
    expect(classifyInput('https://a.comhttps://b.com')).toEqual({
      kind: 'links',
      urls: ['https://a.com', 'https://b.com'],
    });
  });

  it(`caps a pasted list at ${MAX_LINKS} links`, () => {
    const text = Array.from({ length: MAX_LINKS + 5 }, (_, i) => `site${i}.com`).join(' ');
    const intent = classifyInput(text);
    expect(intent.kind).toBe('links');
    if (intent.kind === 'links') expect(intent.urls).toHaveLength(MAX_LINKS);
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

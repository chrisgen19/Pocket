import { createBookmarkSchema } from './schemas';

/** Most links one paste or one Enter can save. */
export const MAX_LINKS = 50;

/** What the header box will do with its text. */
export type OmniboxIntent =
  | { kind: 'empty' }
  | { kind: 'search'; query: string }
  | { kind: 'link'; url: string }
  | { kind: 'links'; urls: string[] }
  | { kind: 'invalid'; message: string };

const HTTP_RE = /^https?:\/\//i;
// A link typed without a scheme: dotted host with a 2+ letter TLD, localhost or an
// IPv4 address, optional port and path. "figma" or "e.g." stay words.
const BARE_LINK_RE =
  /^(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|(?:[a-z0-9-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#]\S*)?$/i;
// Schemes that can't be saved, so "ftp://..." or "javascript:..." get an inline
// explanation instead of silently turning into a search.
const OTHER_SCHEME_RE = /^(?:[a-z][a-z0-9+.-]*:\/\/|(?:mailto|javascript|data|tel|file|about):)/i;
// Quotes, brackets and sentence punctuation stuck to a link in pasted prose.
const LEADING_RE = /^[<("'[]+/;
const TRAILING_RE = /[>"'\],.;:!?]+$/;

/** Strips wrapping punctuation; a closing ")" only when unbalanced, as in "(see x.com)". */
const trimWrapping = (token: string): string => {
  let t = token.replace(LEADING_RE, '').replace(TRAILING_RE, '');
  while (t.endsWith(')') && !t.includes('(')) t = t.slice(0, -1).replace(TRAILING_RE, '');
  return t;
};

// "http(s)://" glued straight onto a letter or digit, as when links lose the newline
// between them ("a.comhttps://b.com"). After "=", "/", "?", "&" or "#" it is part of
// the URL instead: redirects (?next=https://...) and archives (/web/2020/https://...).
const GLUED_LINK_RE = /(?<=[a-z0-9])(?=https?:\/\/)/i;

/**
 * Splits text into tokens on whitespace and where links were glued together without a
 * separator, keeping URLs embedded in another URL's query, path or fragment intact.
 */
const tokenize = (text: string): string[] =>
  text
    .split(/\s+/)
    .flatMap((part) => part.split(GLUED_LINK_RE))
    .map(trimWrapping)
    .filter(Boolean);

const isLinkLike = (token: string) => HTTP_RE.test(token) || BARE_LINK_RE.test(token);

/** The URL the server would store for a token (https:// added), or null if invalid. */
const toUrl = (token: string): string | null => {
  const parsed = createBookmarkSchema.shape.url.safeParse(token);
  return parsed.success ? parsed.data : null;
};

const uniqueUrls = (tokens: string[]): string[] => [
  ...new Set(tokens.map(toUrl).filter((url): url is string => url !== null)),
];

/** Decides between search, saving one link, saving several, or explaining a bad link. */
export const classifyInput = (raw: string): OmniboxIntent => {
  const text = raw.trim();
  if (!text) return { kind: 'empty' };
  const tokens = tokenize(text);

  if (tokens.length === 1) {
    const [token] = tokens;
    if (isLinkLike(token)) {
      const url = toUrl(token);
      return url
        ? { kind: 'link', url }
        : { kind: 'invalid', message: "That doesn't look like a complete web address." };
    }
    if (OTHER_SCHEME_RE.test(token)) {
      return { kind: 'invalid', message: 'Only web links (http or https) can be saved.' };
    }
    return { kind: 'search', query: text };
  }

  if (tokens.every(isLinkLike)) {
    const urls = uniqueUrls(tokens).slice(0, MAX_LINKS);
    if (urls.length > 1) return { kind: 'links', urls };
    if (urls.length === 1) return { kind: 'link', url: urls[0] };
  }
  return { kind: 'search', query: text };
};

/**
 * Links in pasted text. Links with a scheme are always picked up; bare domains only
 * when the text is nothing but links, so prose mentioning "Next.js" isn't a link.
 */
export const extractLinks = (text: string): string[] => {
  const tokens = tokenize(text);
  const picked = tokens.every(isLinkLike) ? tokens : tokens.filter((t) => HTTP_RE.test(t));
  return uniqueUrls(picked).slice(0, MAX_LINKS);
};

/** "https://www.zed.dev/blog/" -> "zed.dev/blog", for showing a link compactly. */
export const displayUrl = (url: string): string =>
  url
    .replace(HTTP_RE, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

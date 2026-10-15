// Tag normalization shared by the web app (request schemas, the create route, tag
// filtering) and the Chrome extension's request schema, imported as "@shared/tags".
//
// Keep this file free of imports: it is bundled by two separate builds (Next.js and
// the extension's Vite build), each with its own node_modules.

/** Canonical form of a tag: trimmed and lowercased, so "Design " and "design" are one tag. */
export const normalizeTag = (tag: string): string => tag.trim().toLowerCase();

/** Normalizes every tag, drops empty ones and removes duplicates, keeping first-seen order. */
export const normalizeTags = (tags: string[]): string[] => [
  ...new Set(tags.map(normalizeTag).filter(Boolean)),
];

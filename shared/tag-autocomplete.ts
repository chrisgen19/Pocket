// Tag autocomplete logic shared by the web app (src/components/saves/tag-chips-input.tsx)
// and the Chrome extension (extension/src/popup/tag-chips-input.tsx), imported as
// "@shared/tag-autocomplete" by both.
//
// Keep this file free of imports: it is bundled by two separate builds (Next.js and
// the extension's Vite build), each with its own node_modules. Importing React or any
// other package here would make the extension bundle a second copy from the root.

/**
 * Suggestions for the tag being typed: case-insensitive substring matches, skipping tags
 * already in the input (except an exact match for the current token), at most `limit`.
 */
export const filterSuggestions = (
  suggestions: string[],
  current: string,
  full: string,
  limit: number,
): string[] => {
  const already = new Set(
    full
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  );
  const q = current.toLowerCase();
  return suggestions
    .filter((s) => !already.has(s.toLowerCase()) || s.toLowerCase() === q)
    .filter((s) => (q ? s.toLowerCase().includes(q) : true))
    .slice(0, limit);
};

// Exact match first, then prefix matches, so typing "design" never picks "design-systems".
const rank = (tag: string, typed: string) => (tag === typed ? 0 : tag.startsWith(typed) ? 1 : 2);

/**
 * Suggestions for a chips input: what `typed` matches, minus the tags already chosen,
 * best matches first (exact, then prefix, then substring), at most `limit`.
 */
export const rankedSuggestions = (
  suggestions: string[],
  typed: string,
  chosen: string[],
  limit: number,
): string[] => {
  // filterSuggestions keeps an exact match even when it's already in the input (the
  // comma field's current word is part of it); a chosen chip should never come back.
  const taken = new Set(chosen.map((t) => t.toLowerCase()));
  return filterSuggestions(suggestions, typed, chosen.join(','), Number.POSITIVE_INFINITY)
    .filter((s) => !taken.has(s.toLowerCase()))
    .sort((a, b) => rank(a, typed) - rank(b, typed))
    .slice(0, limit);
};

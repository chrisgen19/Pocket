// Tag autocomplete logic shared by the web app (src/components/saves/tag-input.tsx)
// and the Chrome extension (extension/src/popup/tag-input.tsx), imported as
// "@shared/tag-autocomplete" by both.
//
// Keep this file free of imports: it is bundled by two separate builds (Next.js and
// the extension's Vite build), each with its own node_modules. Importing React or any
// other package here would make the extension bundle a second copy from the root.

/**
 * Splits the comma-separated tag input at its last comma, so `current` is the tag being
 * typed and `before` is everything ahead of it, normalized to end in ", " when non-empty.
 */
export const splitAtCursor = (value: string): { before: string; current: string } => {
  const lastComma = value.lastIndexOf(',');
  if (lastComma === -1) return { before: '', current: value.trimStart() };
  return {
    before: value.slice(0, lastComma + 1) + (value[lastComma + 1] === ' ' ? '' : ' '),
    current: value.slice(lastComma + 1).trim(),
  };
};

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

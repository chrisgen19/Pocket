import { z } from 'zod';

// Mirrors src/features/saves/schemas.ts in the web app.
// Keep in sync until we promote a shared package.
// Same tag normalization as the server: trim, lowercase, drop empty, dedupe.
const normalizeTags = (tags: string[]): string[] => [
  ...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
];

export const createBookmarkSchema = z.object({
  // Same limit as the server (BOOKMARK_FIELD_MAX.url).
  url: z.string().url().max(8192),
  tags: z
    .array(z.string())
    .transform(normalizeTags)
    .pipe(z.array(z.string().max(40)).max(20))
    .default([]),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;

import { z } from 'zod';

// Mirrors src/features/saves/schemas.ts in the web app.
// Keep in sync until we promote a shared package.
// Same tag normalization as the server: trim, lowercase, drop empty, dedupe.
const normalizeTags = (tags: string[]): string[] => [
  ...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
];

export const createBookmarkSchema = z.object({
  // Same limit and http(s)-only rule as the server (BOOKMARK_FIELD_MAX.url). The popup
  // always sends the full tab URL, so no bare-domain normalization is needed here.
  url: z
    .string()
    .url()
    .max(8192)
    .refine((u) => /^https?:\/\//i.test(u), 'URL must start with http:// or https://'),
  tags: z
    .array(z.string())
    .transform(normalizeTags)
    .pipe(z.array(z.string().max(40)).max(20))
    .default([]),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;

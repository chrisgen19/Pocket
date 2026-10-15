import { normalizeTags } from '@shared/tags';
import { z } from 'zod';

// Mirrors the create schema in src/features/saves/schemas.ts. Tag normalization is
// the same function, from shared/tags.ts; keep the limits below in sync by hand.

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

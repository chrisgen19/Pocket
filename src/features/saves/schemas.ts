import { z } from 'zod';

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

/** Canonical form of a tag: trimmed and lowercased, so "Design " and "design" are one tag. */
export const normalizeTag = (tag: string): string => tag.trim().toLowerCase();

/** Normalizes every tag, drops empty ones and removes duplicates, keeping first-seen order. */
export const normalizeTags = (tags: string[]): string[] => [
  ...new Set(tags.map(normalizeTag).filter(Boolean)),
];

// Normalize first, then enforce limits, so "a, A, a " counts as one tag and a
// whitespace-only tag is dropped rather than rejected.
const tagsSchema = z
  .array(z.string())
  .transform(normalizeTags)
  .pipe(z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS));

export const createBookmarkSchema = z.object({
  url: z.string().url(),
  tags: tagsSchema.default([]),
});

export const updateBookmarkSchema = z
  .object({
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    tags: tagsSchema.optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;

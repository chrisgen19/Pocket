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

// Re-inserts a row the user just deleted (the undo toast), with its original id and
// createdAt. The url is rendered as a link, so only http(s) is accepted; limits are
// generous so a legitimately stored row is never rejected on restore.
export const restoreBookmarkSchema = z.object({
  id: z.string().min(1).max(64),
  url: z
    .string()
    .url()
    .max(8192)
    .refine((u) => /^https?:\/\//i.test(u), 'URL must start with http:// or https://'),
  title: z.string().max(2000),
  domain: z.string().max(255),
  excerpt: z.string().max(10_000),
  imageUrl: z.string().max(16_384),
  tags: tagsSchema,
  isFavorite: z.boolean(),
  isArchived: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
export type RestoreBookmarkInput = z.infer<typeof restoreBookmarkSchema>;

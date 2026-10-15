import { normalizeTags } from '@shared/tags';
import { z } from 'zod';
import { normalizeUrl } from './utils';

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

// Normalize first, then enforce limits, so "a, A, a " counts as one tag and a
// whitespace-only tag is dropped rather than rejected.
const tagsSchema = z
  .array(z.string())
  .transform(normalizeTags)
  .pipe(z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS));

/**
 * Upper bounds for stored bookmark fields. Saving clamps scraped metadata to these
 * (fetchLinkMetadata) and restore applies the same rules, so any row that can be
 * stored can also be restored by the undo toast.
 */
export const BOOKMARK_FIELD_MAX = {
  url: 8192,
  title: 2000,
  domain: 255,
  excerpt: 10_000,
  imageUrl: 16_384,
} as const;

/** Truncates text to `max` characters. */
export const clampText = (value: string, max: number): string =>
  value.length > max ? value.slice(0, max) : value;

const httpUrlSchema = z
  .string()
  .url()
  .max(BOOKMARK_FIELD_MAX.url)
  .refine((u) => /^https?:\/\//i.test(u), 'URL must start with http:// or https://');

export const createBookmarkSchema = z.object({
  // Normalize before validating, so a bare domain like "example.com" is accepted (as
  // https://example.com) and only http(s) URLs are ever stored.
  url: z.preprocess(
    (value) => (typeof value === 'string' ? normalizeUrl(value) : value),
    httpUrlSchema,
  ),
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
// createdAt. The url is rendered as a link, so only http(s) is accepted. Text fields
// are clamped rather than rejected, so a row stored before these limits existed still
// restores (truncated) instead of failing and staying deleted; an image URL too long
// to be usable is dropped, which shows the placeholder.
export const restoreBookmarkSchema = z.object({
  id: z.string().min(1).max(64),
  url: httpUrlSchema,
  title: z.string().transform((s) => clampText(s, BOOKMARK_FIELD_MAX.title)),
  domain: z.string().transform((s) => clampText(s, BOOKMARK_FIELD_MAX.domain)),
  excerpt: z.string().transform((s) => clampText(s, BOOKMARK_FIELD_MAX.excerpt)),
  imageUrl: z.string().transform((s) => (s.length > BOOKMARK_FIELD_MAX.imageUrl ? '' : s)),
  tags: tagsSchema,
  isFavorite: z.boolean(),
  isArchived: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
export type RestoreBookmarkInput = z.infer<typeof restoreBookmarkSchema>;

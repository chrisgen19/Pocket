import { z } from 'zod';

export const createBookmarkSchema = z.object({
  url: z.string().url(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const updateBookmarkSchema = z.object({
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;

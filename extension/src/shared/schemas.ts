import { z } from 'zod';

// Mirrors src/features/saves/schemas.ts in the web app.
// Keep in sync until we promote a shared package.
export const createBookmarkSchema = z.object({
  url: z.string().url(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;

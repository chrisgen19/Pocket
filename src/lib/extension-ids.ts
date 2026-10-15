import { z } from 'zod';

// Chrome extension IDs are always 32 characters from a-p.
const EXTENSION_ID_PATTERN = /^[a-p]{32}$/;

// Parses the comma-separated EXTENSION_IDS env var. Kept in its own module so
// src/proxy.ts can validate it without importing the full env schema.
export const extensionIdsSchema = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  )
  .pipe(
    z.array(
      z.string().regex(EXTENSION_ID_PATTERN, 'must be a 32-character Chrome extension ID (a-p)'),
    ),
  );

import { z } from 'zod';

// Chrome extension IDs are always 32 characters from a-p.
const EXTENSION_ID_PATTERN = /^[a-p]{32}$/;

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url(),
  // Comma-separated list. Optional: unset means no extension gets CORS or trusted-origin access.
  EXTENSION_IDS: z
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
    ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;

import { z } from 'zod';
import { extensionIdsSchema } from './extension-ids';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url(),
  // Comma-separated list. Optional: unset means no extension gets CORS or trusted-origin access.
  EXTENSION_IDS: extensionIdsSchema,
  // Shared iCloud link of the "Save to Pocket" shortcut. Optional: unset or empty
  // hides the "Add to iPhone" button on /settings.
  IOS_SHORTCUT_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z
      .string()
      .startsWith('https://www.icloud.com/shortcuts/', 'must be an iCloud shortcut link')
      .optional(),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;

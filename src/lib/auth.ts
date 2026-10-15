import { apiKey } from '@better-auth/api-key';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { env } from './env';
import { prisma } from './prisma';

export const API_KEY_PREFIX = 'pocket_';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.EXTENSION_IDS.map((id) => `chrome-extension://${id}`),
  advanced: {
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },
  plugins: [
    // Personal API keys for clients that can't carry the session cookie, such as the
    // Apple Shortcuts "Save to Pocket" action. Keys are only honoured by our own
    // bookmark routes (src/lib/session.ts); enableSessionForAPIKeys stays off so a
    // key can never act as a full login on /api/auth/* (e.g. to mint more keys).
    apiKey({
      defaultPrefix: API_KEY_PREFIX,
      // Keep the prefix plus 4 random characters so keys are distinguishable in the list.
      startingCharactersConfig: { charactersLength: API_KEY_PREFIX.length + 4 },
      // The plugin default is 10 requests per day, far too low for saving from a phone.
      rateLimit: { enabled: true, timeWindow: 60 * 1000, maxRequests: 30 },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

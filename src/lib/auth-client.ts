'use client';

import { createAuthClient } from 'better-auth/react';

// Server-rendered passes need an explicit baseURL. We fall back to a sane
// local default so a missing BETTER_AUTH_URL in dev surfaces as a clear
// network error instead of a confusing "undefined URL" crash. In production
// the server-side env validation in `src/lib/env.ts` already requires it.
const SSR_BASE_URL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: typeof window === 'undefined' ? SSR_BASE_URL : window.location.origin,
});

export const { signIn, signUp, signOut, useSession } = authClient;

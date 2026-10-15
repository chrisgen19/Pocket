import { headers } from 'next/headers';
import { auth } from './auth';

/** Header carrying a personal API key, e.g. from the Apple Shortcuts action. */
export const API_KEY_HEADER = 'x-api-key';

type RouteSession = { user: { id: string } };

/**
 * Resolves the caller for the bookmark API routes: a personal API key in the
 * `x-api-key` header if present, otherwise the Better Auth session cookie. Only the
 * user id is returned, which is all these routes use. An invalid, revoked, expired
 * or rate-limited key returns null (401) rather than falling back to the cookie.
 */
export async function getSession(): Promise<RouteSession | null> {
  const requestHeaders = await headers();
  const key = requestHeaders.get(API_KEY_HEADER);
  if (key) {
    const result = await auth.api.verifyApiKey({ body: { key } });
    return result.valid && result.key ? { user: { id: result.key.referenceId } } : null;
  }
  const session = await auth.api.getSession({ headers: requestHeaders });
  return session ? { user: { id: session.user.id } } : null;
}

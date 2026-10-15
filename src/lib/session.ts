import { isAPIError } from 'better-auth/api';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from './auth';

/** Header carrying a personal API key, e.g. from the Apple Shortcuts action. */
export const API_KEY_HEADER = 'x-api-key';

/** Either the caller's user id, or the error response the route should return as is. */
export type RouteAuth =
  | { userId: string; response?: undefined }
  | { userId?: undefined; response: NextResponse };

// Codes the api-key plugin uses for "valid key, but too many requests right now".
const RATE_LIMIT_CODES = new Set(['RATE_LIMITED', 'USAGE_EXCEEDED']);

const unauthorized = (): RouteAuth => ({
  response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
});

const tooManyRequests = (tryAgainInMs: unknown): RouteAuth => {
  const seconds =
    typeof tryAgainInMs === 'number' && tryAgainInMs > 0 ? Math.ceil(tryAgainInMs / 1000) : null;
  return {
    response: NextResponse.json(
      { error: 'Too many requests with this API key, try again shortly' },
      { status: 429, headers: seconds ? { 'Retry-After': String(seconds) } : undefined },
    ),
  };
};

/** Reads `details.tryAgainIn` (ms) from a plugin error body, if present. */
const tryAgainIn = (body: unknown): unknown =>
  body && typeof body === 'object' && 'details' in body
    ? (body.details as { tryAgainIn?: unknown } | undefined)?.tryAgainIn
    : undefined;

async function authenticateApiKey(key: string): Promise<RouteAuth> {
  try {
    const result = await auth.api.verifyApiKey({ body: { key } });
    if (result.valid && result.key) return { userId: result.key.referenceId };
    // 1.6.x catches its own rate-limit error and reports it here as valid: false.
    if (result.error && RATE_LIMIT_CODES.has(String(result.error.code))) {
      return tooManyRequests(tryAgainIn(result.error));
    }
    return unauthorized();
  } catch (err) {
    // Server-side Better Auth calls can throw APIError instead (other versions or
    // paths); map it rather than letting every route answer 500.
    if (isAPIError(err)) {
      return err.statusCode === 429 ? tooManyRequests(tryAgainIn(err.body)) : unauthorized();
    }
    throw err;
  }
}

/**
 * Authenticates a bookmark API request: a personal API key in the `x-api-key`
 * header if present, otherwise the Better Auth session cookie. An invalid, revoked
 * or expired key gets 401 and a rate-limited key gets 429 (with Retry-After when
 * known); a key never falls back to the cookie.
 */
export async function authenticateRequest(): Promise<RouteAuth> {
  const requestHeaders = await headers();
  const key = requestHeaders.get(API_KEY_HEADER);
  if (key) return authenticateApiKey(key);
  const session = await auth.api.getSession({ headers: requestHeaders });
  return session ? { userId: session.user.id } : unauthorized();
}

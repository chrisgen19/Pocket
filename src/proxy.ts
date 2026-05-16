import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/saves'];

const ALLOWED_EXTENSION_ORIGINS = new Set(
  (process.env.EXTENSION_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => `chrome-extension://${id}`),
);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin') ?? '';
  const isAllowedExtension = ALLOWED_EXTENSION_ORIGINS.has(origin);

  // CORS for the Chrome extension — only allow origins in EXTENSION_IDS so we
  // don't hand credentialed responses to every installed extension.
  if (pathname.startsWith('/api/')) {
    if (request.method === 'OPTIONS' && isAllowedExtension) {
      return new NextResponse(null, { status: 204, headers: corsHeaders(origin, request) });
    }
    const response = NextResponse.next();
    if (isAllowedExtension) {
      for (const [k, v] of Object.entries(corsHeaders(origin, request))) {
        response.headers.set(k, v);
      }
    }
    return response;
  }

  // getSessionCookie only checks presence, not signature — sufficient for
  // protecting routes (the API verifies the session for real). We do NOT
  // redirect logged-in visitors away from /login or /register because a stale
  // cookie (post-secret-rotation, expired session, etc.) would otherwise trap
  // the user on /saves with no way to re-authenticate.
  const sessionCookie = getSessionCookie(request);
  const isAuthed = Boolean(sessionCookie);

  if (!isAuthed && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function corsHeaders(origin: string, request: NextRequest) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      request.headers.get('access-control-request-headers') ?? 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export const config = {
  // Run on app routes AND /api/* (for CORS).
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

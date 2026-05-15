import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/saves'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

export const config = {
  // Run on app routes; skip static assets, Next internals, and API routes.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

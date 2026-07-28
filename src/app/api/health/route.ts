import { NextResponse } from 'next/server';

// Pinned so the probe always executes at request time. Route Handlers are
// uncached by default in this Next version, but a GET touching no runtime data
// becomes prerenderable once Cache Components is enabled, and a static response
// would still return 200 from a server that had stopped working.
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Container liveness probe for the Coolify/Docker healthcheck. Deliberately
 * touches neither the database nor auth: every app on this host shares one
 * Postgres instance, so a deep check would mark them all unhealthy during a
 * single database blip and restart the lot at once. This answers only "is the
 * server serving HTTP?".
 *
 * This is exactly the failure this app hit: the Coolify start command is
 * `prisma migrate deploy && pnpm start`, so an unreachable database exited the
 * process before Next ever listened, and it restart-looped 652 times with no
 * signal to the proxy.
 */
export function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

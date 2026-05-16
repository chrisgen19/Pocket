import { type NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGIN_PREFIX = 'chrome-extension://';

export const config = {
  matcher: '/api/:path*',
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const isExtension = origin.startsWith(ALLOWED_ORIGIN_PREFIX);

  if (request.method === 'OPTIONS' && isExtension) {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin, request),
    });
  }

  const response = NextResponse.next();
  if (isExtension) {
    for (const [key, value] of Object.entries(corsHeaders(origin, request))) {
      response.headers.set(key, value);
    }
  }
  return response;
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

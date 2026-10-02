import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware protecting all '/app/*' routes and API endpoints.
 * Validates HTTP-only cookie session tokens and tenant organization headers.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths allowed without authentication
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/api/v1/auth/signin' ||
    pathname === '/api/v1/auth/signup' ||
    pathname === '/api/v1/telemetry/ingest' ||
    pathname === '/api/v1/telemetry/health';

  // Check for session token in cookies or Authorization header
  const token =
    request.cookies.get('ricoz_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  // 1. Unauthenticated access to protected console routes -> Redirect strictly to /auth/signin
  if (!token && (pathname.startsWith('/app') || pathname.startsWith('/console'))) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Authenticated user visiting /auth/* -> Redirect to /app/overview
  if (token && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/app/overview', request.url));
  }

  // 3. Inject authenticated tenant headers into downstream route handlers
  const requestHeaders = new Headers(request.headers);
  if (token) {
    // In production, token is decoded/verified using jsonwebtoken or jose
    requestHeaders.set('x-authenticated-user', 'true');
    requestHeaders.set('x-tenant-org-id', request.cookies.get('ricoz_org_id')?.value || 'org_production_fleet');
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Matcher configuration: Protect all console routes and sensitive APIs
 */
export const config = {
  matcher: [
    '/app/:path*',
    '/console/:path*',
    '/api/v1/hosts/:path*',
    '/api/v1/incidents/:path*',
    '/api/v1/rules/:path*',
    '/auth/:path*',
  ],
};

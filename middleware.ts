import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Routes that are always public (no login required)
const publicPaths = ['/', '/pricing', '/auth/login', '/auth/register'];
// Path prefixes that are public (e.g. /plants, /plants/tomato)
const publicPrefixes = ['/plants'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow explicitly public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public prefix paths (plant catalog is public)
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // All other pages require authentication
  if (!req.auth) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Sync locale from user session to cookie if logged in
  const response = NextResponse.next();
  const userLocale = (req.auth?.user as Record<string, unknown>)?.locale as string | undefined;
  if (userLocale && ['en', 'fr'].includes(userLocale)) {
    const currentCookie = req.cookies.get('locale')?.value;
    if (currentCookie !== userLocale) {
      response.cookies.set('locale', userLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
  }

  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight middleware to redirect unauthenticated users to `/login`
 * for protected routes under `/dashboard`, `/settings`, and `/assistant`.
 *
 * This checks for a simple `sb-access-token` cookie set after sign-in.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedPaths = ['/dashboard', '/settings', '/assistant'];

  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get('sb-access-token');
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/assistant/:path*'],
};

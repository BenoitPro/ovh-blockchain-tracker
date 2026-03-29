import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/auth/session';

const PRIVATE_PATHS = ['/nodes', '/ethereum/nodes', '/lead'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPrivate = PRIVATE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  if (!isPrivate) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value ?? '';

  if (verifySession(token)) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/nodes/:path*', '/ethereum/nodes/:path*', '/lead/:path*'],
};

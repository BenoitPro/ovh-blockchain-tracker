import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'ovh_session';
const PRIVATE_PATHS = ['/nodes', '/ethereum/nodes', '/lead'];

async function verifySession(token: string): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const expected = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const expectedHex = Array.from(new Uint8Array(expected)).map(b => b.toString(16).padStart(2, '0')).join('');
  return sig === expectedHex;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPrivate = PRIVATE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  if (!isPrivate) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value ?? '';

  if (await verifySession(token)) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/nodes/:path*', '/ethereum/nodes/:path*', '/lead/:path*'],
};

import { NextRequest, NextResponse } from 'next/server';
import { signSession, COOKIE_NAME, UI_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (
    username !== process.env.AUTH_USERNAME ||
    password !== process.env.AUTH_PASSWORD
  ) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = signSession(username);
  const isProd = process.env.NODE_ENV === 'production';

  const res = NextResponse.json({ ok: true });

  // HttpOnly session cookie — used by middleware for security
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });

  // Readable UI cookie — used by Sidebar to show/hide logout button
  res.cookies.set(UI_COOKIE_NAME, '1', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });

  return res;
}

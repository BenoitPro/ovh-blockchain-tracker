import { NextResponse } from 'next/server';
import { COOKIE_NAME, UI_COOKIE_NAME } from '@/lib/auth/session';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  res.cookies.set(UI_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}

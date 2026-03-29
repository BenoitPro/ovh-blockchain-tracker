import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.AUTH_SECRET!;
const COOKIE_NAME = 'ovh_session';
const UI_COOKIE_NAME = 'ovh_ui';

export function signSession(username: string): string {
  const payload = `${username}:${Date.now()}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySession(token: string): boolean {
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export { COOKIE_NAME, UI_COOKIE_NAME };

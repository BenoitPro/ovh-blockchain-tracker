# Auth & Private Routes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a lightweight authentication layer protecting `/nodes`, `/ethereum/nodes`, and `/lead` with a single shared credential, accessible via a discreet sidebar link.

**Architecture:** Credentials stored in `.env.local`. Next.js `middleware.ts` intercepts protected routes and redirects unauthenticated users to `/login`. Session is an HMAC-SHA256 signed cookie (`ovh_session`, HttpOnly) for security, plus a non-HttpOnly `ovh_ui=1` cookie so the client-side Sidebar can toggle "Admin" / "Déconnexion" without an extra API call.

**Tech Stack:** Next.js App Router, Node.js built-in `crypto` (no new dependencies), TypeScript, Tailwind CSS.

---

### Task 1: Add auth environment variables

**Files:**
- Modify: `.env.local` (at project root)

**Step 1: Add these three lines to `.env.local`**

```
AUTH_USERNAME=admin
AUTH_PASSWORD=changeme123
AUTH_SECRET=replace-this-with-a-random-32-char-string-minimum
```

> Replace all three values with your real credentials before deploying. `AUTH_SECRET` must be at least 32 random characters.

**Step 2: Verify the file is in `.gitignore`**

Run: `cat .gitignore | grep .env`
Expected: see `.env.local` listed (it should already be there from Next.js defaults).

---

### Task 2: Create session helper (sign + verify cookie)

**Files:**
- Create: `src/lib/auth/session.ts`

**Step 1: Create the file**

```typescript
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
```

**Step 2: No test needed for this task** (crypto primitives are tested by the API route tests in Task 3).

---

### Task 3: Create login API route

**Files:**
- Create: `src/app/api/auth/login/route.ts`

**Step 1: Create the file**

```typescript
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
    maxAge: 60 * 60 * 24 * 365, // 1 year (logout-only expiry)
  });

  // Readable UI cookie — used by Sidebar to show/hide logout button
  res.cookies.set(UI_COOKIE_NAME, '1', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}
```

**Step 2: Run the dev server and test manually**

```bash
npm run dev
```

Then in a new terminal:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme123"}'
```

Expected: `{"ok":true}` with `Set-Cookie` headers for both cookies.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}'
```

Expected: `{"error":"Invalid credentials"}` with status 401.

---

### Task 4: Create logout API route

**Files:**
- Create: `src/app/api/auth/logout/route.ts`

**Step 1: Create the file**

```typescript
import { NextResponse } from 'next/server';
import { COOKIE_NAME, UI_COOKIE_NAME } from '@/lib/auth/session';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  res.cookies.set(UI_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
```

**Step 2: Test manually**

```bash
curl -X POST http://localhost:3000/api/auth/logout
```

Expected: `{"ok":true}` with cookies cleared (`Max-Age=0`).

---

### Task 5: Create middleware to protect private routes

**Files:**
- Create: `src/middleware.ts` (at project root, alongside `src/`)

**Step 1: Create the file**

```typescript
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
```

**Step 2: Test the redirect**

With the dev server running, open `http://localhost:3000/nodes` in an incognito browser.
Expected: redirected to `/login?from=/nodes`.

---

### Task 6: Create the login page

**Files:**
- Create: `src/app/login/page.tsx`

**Step 1: Create the file**

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/nodes';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push(from);
    } else {
      setError('Identifiant ou mot de passe incorrect.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90 px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-8 border border-white/10"
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 40px rgba(0,240,255,0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/ovhcloud-logo.png"
            alt="OVHcloud"
            width={140}
            height={35}
            className="h-8 w-auto"
            style={{ filter: 'brightness(1.15) drop-shadow(0 0 12px rgba(255,255,255,0.25))' }}
          />
        </div>

        <h1 className="text-white/80 text-sm font-bold uppercase tracking-widest text-center mb-6">
          Accès interne
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Identifiant"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
          />

          {error && (
            <p className="text-red-400/80 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-black transition-all duration-200 disabled:opacity-50"
            style={{ background: loading ? '#00F0FF80' : '#00F0FF' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Visit `http://localhost:3000/login`**
Expected: centered dark form with OVHcloud logo, two inputs, cyan button.

**Step 3: Test the full login flow**
1. Go to `http://localhost:3000/nodes` in incognito → redirected to `/login?from=/nodes`
2. Enter correct credentials → redirected back to `/nodes`, page loads
3. Close and reopen the browser → still logged in (persistent cookie)
4. Go to `http://localhost:3000/nodes` again → loads directly (no redirect)

---

### Task 7: Update Sidebar with discreet admin/logout link

**Files:**
- Modify: `src/components/dashboard/Sidebar.tsx`

**Step 1: Add `useEffect` and `useState` import (already imported), add auth state**

At the top of the `Sidebar` function body, after the existing `useState`:

```typescript
const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  setIsLoggedIn(document.cookie.includes('ovh_ui=1'));
}, []);
```

**Step 2: Add logout handler**

```typescript
async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  setIsLoggedIn(false);
  setMobileOpen(false);
}
```

**Step 3: Add the discreet link in the CTA section**

In the CTA section (`{/* ── 4. CTA & Resources ── */}`), just **before** the `<div className={`h-px mb-2 ${divider}`} />` line, add:

```tsx
{/* Admin / Logout — discreet internal link */}
{isLoggedIn ? (
  <button
    onClick={handleLogout}
    className={`w-full text-center text-[9px] uppercase tracking-[0.15em] transition-colors duration-200 py-1 ${
      isEth ? 'text-slate-400/40 hover:text-slate-400/70' : 'text-white/20 hover:text-white/50'
    }`}
  >
    Déconnexion
  </button>
) : (
  <Link
    href="/login"
    onClick={() => setMobileOpen(false)}
    className={`block w-full text-center text-[9px] uppercase tracking-[0.15em] transition-colors duration-200 py-1 ${
      isEth ? 'text-slate-400/40 hover:text-slate-400/70' : 'text-white/20 hover:text-white/50'
    }`}
  >
    Admin
  </Link>
)}
```

**Step 4: Add `useEffect` import**

The file already imports `useState` from React. Update that line:

```typescript
import { useState, useEffect } from 'react';
```

**Step 5: Verify visual result**
- Not logged in: barely visible "ADMIN" text above the divider
- Logged in: "DÉCONNEXION" text in the same spot
- Clicking Déconnexion → cookies cleared, text reverts to "ADMIN"

---

### Task 8: Create placeholder `/lead` page

**Files:**
- Create: `src/app/lead/page.tsx`

**Step 1: Create a minimal placeholder**

```typescript
export default function LeadPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/40 text-sm">Lead — coming soon.</p>
    </div>
  );
}
```

This ensures the route exists and is protected by middleware. Content will be added later.

**Step 2: Verify protection**

In incognito, visit `http://localhost:3000/lead`.
Expected: redirected to `/login?from=/lead`.

---

### Task 9: Final end-to-end verification

**Step 1: Full logout → protected route → login → access flow**

1. Make sure you're logged out (clear cookies or use incognito)
2. Click "Admin" in sidebar → lands on `/login`
3. Enter credentials → redirected to `/nodes`, page loads normally
4. Sidebar now shows "DÉCONNEXION"
5. Click "DÉCONNEXION" → text reverts to "ADMIN", navigate to `/nodes` manually → redirected to `/login`

**Step 2: Verify public pages are unaffected**

While logged out, confirm these all load without redirect:
- `/` (Dashboard)
- `/analytics`
- `/ethereum`
- `/ethereum/analytics`
- `/about`

**Step 3: Run linter**

```bash
npm run lint
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/middleware.ts src/lib/auth/session.ts \
        src/app/api/auth/login/route.ts src/app/api/auth/logout/route.ts \
        src/app/login/page.tsx src/app/lead/page.tsx \
        src/components/dashboard/Sidebar.tsx \
        docs/plans/
git commit -m "feat: add lightweight auth with private routes (/nodes, /ethereum/nodes, /lead)"
```

> **Do not commit `.env.local`** — it contains secrets.

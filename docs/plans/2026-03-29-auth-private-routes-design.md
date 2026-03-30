# Auth & Private Routes — Design Doc

**Date:** 2026-03-29
**Status:** Approved

## Context

The OVH Blockchain Tracker is currently a fully public dashboard. The team needs a lightweight authentication layer so internal pages (Explorer, future Lead page) are only accessible to colleagues, without adding the complexity of a full auth framework.

## Approach: Middleware + signed cookie (no extra dependencies)

Credentials stored in `.env.local`. A Next.js `middleware.ts` checks every request to protected routes and redirects unauthenticated users to `/login`. Sessions persist via an HMAC-SHA256 signed cookie (using Node's built-in `crypto`) — no expiry, cleared only on explicit logout.

## Private Routes

- `/nodes` — Solana Explorer
- `/ethereum/nodes` — Ethereum Explorer
- `/lead` — Future internal lead page (content TBD)

Public routes remain unchanged (Dashboard, Analytics, About, Use Cases, etc.).

## Files

| File | Action |
|------|--------|
| `src/middleware.ts` | Create — intercepts private routes, validates cookie |
| `src/lib/auth/session.ts` | Create — cookie sign/verify helpers using `crypto` |
| `src/app/login/page.tsx` | Create — simple login form |
| `src/app/api/auth/login/route.ts` | Create — validates credentials, sets cookie |
| `src/app/api/auth/logout/route.ts` | Create — clears cookie |
| `src/components/dashboard/Sidebar.tsx` | Modify — add discreet login/logout link above the 2 existing buttons |
| `.env.local` | Modify — add `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET` |

## Environment Variables

```
AUTH_USERNAME=<shared login>
AUTH_PASSWORD=<shared password>
AUTH_SECRET=<random 32+ char string for HMAC signing>
```

## UX — Sidebar

- **Logged out:** subtle text link "Admin" just above "Contact Us" button → navigates to `/login`
- **Logged in:** same spot shows "Déconnexion" link → calls logout API and redirects to home
- Protected nav items (Explorer) are still visible in the sidebar but redirect to `/login` if accessed without auth (middleware handles this transparently)

## Login Page

- Centered minimal form: username + password fields + submit button
- On success: redirect to originally requested URL (or `/nodes` as default)
- On failure: inline error message, no page reload
- Matches existing dark/cyan visual style

## Session Cookie

- Name: `ovh_session`
- Value: HMAC-SHA256 signature of `username:timestamp` using `AUTH_SECRET`
- Flags: `HttpOnly`, `Secure` (prod), `SameSite=Lax`
- No expiry — persists until browser closes or explicit logout

## Extensibility

To make any additional page private, add its path prefix to the `PRIVATE_PATHS` array in `middleware.ts`. One line change.

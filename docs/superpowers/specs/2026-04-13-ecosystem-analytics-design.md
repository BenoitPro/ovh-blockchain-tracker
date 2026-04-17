# Ecosystem Page + Analytics Enrichment — Design Spec

**Date:** 2026-04-13  
**Status:** Approved  
**Approach:** A — Réorganisation légère

---

## Context

The current navigation per chain exposes two separate pages:
- `/{chain}/use-cases` — case studies, OVH server specs, verified residents on-chain
- `/{chain}/guide` — technical FAQ (node types, hardware, deployment steps, partners)

These pages have overlapping audiences and similar purposes. The navigation is unclear: users don't know whether to look in "Use Cases" or "Guide" for deployment info. Additionally, the Analytics pages are sparse and miss charts that the data already supports.

---

## Goal

1. Merge `/use-cases` and `/guide` into a single `/{chain}/ecosystem` page with a sticky anchor nav
2. Enrich `/{chain}/analytics` with three improvements: pie/bar toggle, trend chart per chain, top OVH operators widget

---

## Part 1 — Ecosystem Page

### Audience

Technical profiles (validator operators, DevOps, Web3 infra teams) who need both social proof (who else runs on OVH?) and practical deployment info. The page leans toward social proof first, technical content second.

### URL & Routing

**Chains with `/{chain}/` prefix** (Avalanche, Ethereum, Sui, Tron, Hyperliquid, BNBChain, Celestia, Monad):

| Old route | New route | Method |
|---|---|---|
| `/{chain}/use-cases` | `/{chain}/ecosystem` | 301 redirect |
| `/{chain}/guide` | `/{chain}/ecosystem` | 301 redirect |

**Solana (root-level pages):**

| Old route | New route | Method |
|---|---|---|
| `/use-cases` | `/ecosystem` | 301 redirect |
| `/guide` | `/ecosystem` | 301 redirect |

Solana's ecosystem page lives at `/ecosystem`, not `/solana/ecosystem`, consistent with the existing pattern (Solana's dashboard is at `/`, not `/solana`).

Redirects added to `next.config.ts` via the `redirects()` function.

### Layout

Single scrollable page with a **sticky anchor nav** pinned at the top. The nav has two items that `scrollIntoView()` to the corresponding section — no page reload, no routing change.

```
┌─────────────────────────────────────────────┐
│ [WHO BUILDS]  [RUN A NODE]          ↕ scroll│  ← sticky
├─────────────────────────────────────────────┤
│ Hero title                                  │
│                                             │
│ §01 WHO BUILDS                              │
│   Case study cards (existing component)     │
│   OVHServerSpecs (existing component)       │
│   VerifiedResidentsGrid (existing component)│
│                                             │
│ §02 RUN A NODE                              │
│   Hardware specs block                      │
│   Deployment steps (numbered list)          │
│   Partners link                             │
│                                             │
│ CTA section                                 │
└─────────────────────────────────────────────┘
```

### Components

**New:**
- `src/components/dashboard/EcosystemPage.tsx` — generic component accepting `chainId`, `accent`, `networkName`, `cases[]`, `guideItems[]` as props. All chain-specific pages are thin wrappers around this component.

**Reused as-is:**
- `UseCasesHero` — chain stats hero
- `OVHServerSpecs` — server recommendation cards
- `VerifiedResidentsGrid` — on-chain detected operators
- `GuidePageLayout` items → inline rendered within EcosystemPage

**New pages (thin wrappers):**
- `src/app/ecosystem/page.tsx` — Solana (root-level)
- `src/app/{chain}/ecosystem/page.tsx` — one per chain (8 chains: Avalanche, Ethereum, Sui, Tron, Hyperliquid, BNBChain, Celestia, Monad), each passes chain-specific data to `EcosystemPage`

### Sidebar update

- `src/components/dashboard/Sidebar.tsx` — replace "Use Cases" + "Guide" links with a single "Ecosystem" link pointing to `/{chain}/ecosystem`
- `src/lib/chains.ts` — register the `ecosystem` route

---

## Part 2 — Analytics Improvements

### ① Provider Breakdown toggle (Bar ↔ Pie)

**Component:** `src/components/dashboard/ProviderComparison.tsx`

- Add `viewMode: 'bar' | 'pie'` local state, defaulting to `'bar'`
- Add a toggle button in the card header (two-segment control: `▬ BAR` / `◉ PIE`)
- `'bar'` mode: existing horizontal bar chart (unchanged)
- `'pie'` mode: `<PieChart>` from Recharts (already a project dependency) with the same `providerBreakdown` data
- Persist selection in `localStorage` key `provider-chart-view` so user preference survives navigation

### ② Trend Chart — extended to all chains

**Components:** `TrendChart.tsx`, `src/app/api/trends/route.ts`

- `TrendChart` becomes generic: accepts `chainId` prop (currently hardcoded to Solana)
- API route `/api/trends` extended to accept `?chain=avalanche|sui|tron|etc.` parameter
- Each `/{chain}/analytics` page passes its `chainId` to `TrendChart`
- Each chain shows only its own trend curve — no multi-chain overlay on a single page

**Prerequisite (Phase 3 gate):** the workers for Avalanche, Sui, Tron must write snapshots into `metrics_history`. This must be verified before implementing. If not yet the case, Phase 3 is deferred until workers are updated.

### ③ Top OVH Operators widget

**New component:** `src/components/dashboard/TopOVHOperators.tsx`

- Placed at the bottom of each `/{chain}/analytics` page, below the geo distribution
- Displays top 10 operators on OVH sorted by node count descending
- Each row: rank · operator name (from Stakewiz mapping or MaxMind org) · node count · arrow link
- Click → navigates to `/{chain}/nodes?operator={name}` (Solana only for now; other chains link to the generic nodes page)
- Data source: already available in the chain cache metrics (`providerBreakdown` + verified residents data)

### Phasing

| Phase | Scope | Dependency |
|---|---|---|
| 1 | Ecosystem page (fusion + redirects + sidebar) | None |
| 2 | Analytics: pie/bar toggle + TopOVHOperators | None |
| 3 | Analytics: TrendChart multi-chain | Workers must write `metrics_history` per chain |

---

## What Does Not Change

- All backend API routes — no modification
- Workers and cache system — untouched
- Dashboard, Nodes pages — unchanged
- Existing case study data and guide items — moved into EcosystemPage props, not rewritten

---

## Definition of Done

- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Old URLs (`/use-cases`, `/guide`) redirect correctly (301)
- [ ] Sidebar shows single "Ecosystem" link per chain
- [ ] Toggle pie/bar works and persists across navigation
- [ ] TopOVHOperators renders with real data on at least Solana and Avalanche

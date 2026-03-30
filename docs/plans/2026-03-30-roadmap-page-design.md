# Design Doc — `/roadmap` Page ("Blockchain Roadmap")

**Date:** 2026-03-30
**Status:** Approved
**Route:** `/roadmap`
**Access:** Private — requires `ovh_ui=1` cookie (same guard as Explorer and Lead)

---

## Overview

An internal page that documents OVH's blockchain integration roadmap: which chains have been evaluated, which are prioritized, and the technical details needed to implement each one. Audience is internal OVH team only.

---

## Access & Auth

- Sidebar: `{isLoggedIn && <Link href="/roadmap">Roadmap <InternalBadge /></Link>}` — same pattern as Explorer/Lead
- Page-level: redirect to `/` (or show locked state) if `!isLoggedIn` on mount, matching existing private page behavior
- No server-side auth changes required

---

## Section 1 — Comparative Table

### Row Ordering (visual priority tiers)

| Tier | Chains | Visual treatment |
|------|--------|-----------------|
| Integrated | Solana, Ethereum | Full brightness, "Integrated" green badge |
| Phase 1 | Avalanche, Sui | Cyan left border highlight |
| Phase 2 | Hyperliquid, TON | Slightly dimmed (opacity-90) |
| Phase 3 / Optional | Polkadot, Cosmos SDK, BTC L2s | More dimmed (opacity-60), italic status |
| Excluded | Aptos, Near, others | Grey row, "Excluded" red badge, visually de-emphasized |

### Columns

| Column | Description |
|--------|-------------|
| Chain | Logo icon + name, color-coded pill |
| Active validators | Count with source citation; *italic (to refine)* when uncertain |
| Required hardware | OVH server SKU(s) that fit the spec (e.g. "Advance-1 / Rise-3") |
| Validator opportunity | ★ score (1–5) + short label |
| RPC opportunity | ★ score (1–5) — separate from validator (e.g. high RPC demand, low validator count) |
| App ecosystem opportunity | ★ score + top protocols listed (e.g. Morpho, Aave, Uniswap for ETH) |
| IP access | green = open, yellow = partial/limited, red = blocked (e.g. TON ADNL) |
| Momentum 2025-26 | Tag: Rising / Stable / Declining |
| Status | Integrated / Phase 1 / Phase 2 / Optional / Excluded |

### Inline Editing

- Cells are `contentEditable` on double-click
- Changes persisted to `localStorage` (keyed by `roadmap-cell-{chain}-{column}`)
- "Edited" dot indicator appears on modified cells
- "Reset" button per cell restores default value
- Save is automatic on blur (no explicit save button needed)
- No backend persistence in v1; a future `POST /api/roadmap` endpoint can be added if needed

---

## Section 2 — Implementation Timeline

Horizontal roadmap visualization:

```
[Integrated] ——— [Phase 1] ——— [Phase 2] ——— [Phase 3?]
Solana · ETH     Avalanche      Hyperliquid    Polkadot
                 Sui            TON            Cosmos SDK
                                               BTC L2s (?)
```

- Connecting line with phase nodes (circles)
- Cards below each node with: chain names, one-line rationale, ETA if known
- Phase 3 nodes visually faded with `?` marker and dashed border
- No animation required — static layout is sufficient

---

## Section 3 — Per-chain Detail Accordion (Phase 1 + 2)

Chains covered: Avalanche, Sui, Hyperliquid, TON

Each accordion block expands to show:

1. **API endpoint** — exact URL in `<code>` monospace block
2. **Machine specs** — RAM / CPU / Storage / bandwidth requirements
3. **OVH server match** — specific SKU recommendation
4. **Red flags** — e.g. "TON uses ADNL (UDP-based custom protocol) — standard IP-based ASN detection may fail"
5. Uncertain data marked *italic (to refine)*

---

## Pre-filled Data (best current knowledge)

### Avalanche
- Validators: ~1,500 active *(to refine)*
- Hardware: 8 cores, 16 GB RAM, 1 TB SSD NVMe → OVH Advance-1 or Rise-3
- Validator API: `https://api.avax.network/ext/info` (public)
- RPC: `https://api.avax.network/ext/bc/C/rpc`
- Validator opp: ★★★★ | RPC opp: ★★★ | App ecosystem: ★★★ (AVAX DeFi: Trader Joe, Benqi)
- IP access: green
- Momentum: Rising
- Red flags: C-Chain / P-Chain / X-Chain split — need to decide which to track

### Sui
- Validators: ~100 active *(to refine)*
- Hardware: 10 cores, 32 GB RAM, 2 TB SSD NVMe → OVH Advance-2 or High-Grade
- Validator API: `https://fullnode.mainnet.sui.io` (JSON-RPC)
- Validator opp: ★★★ | RPC opp: ★★★★ | App ecosystem: ★★ (ecosystem still early)
- IP access: green
- Momentum: Rising fast
- Red flags: High hardware requirements; permissioned validator set *(to refine)*

### Hyperliquid
- Validators: ~20 *(to refine — very small set, permissioned)*
- Hardware: high-performance, HFT-grade latency *(to refine)*
- API: no public validator API documented *(to refine)*
- Validator opp: ★★ | RPC opp: ★★ | App ecosystem: ★★★★ (native perps DEX, large TVL)
- IP access: yellow *(to refine)*
- Momentum: Rising fast
- Red flags: Closed/permissioned validator set; limited public infra access; custom L1

### TON
- Validators: ~400 active *(to refine)*
- Hardware: 8 cores, 16 GB RAM, 1 TB SSD → OVH Advance-1
- API: `https://toncenter.com/api/v2/` (public HTTP), but node P2P uses ADNL
- Validator opp: ★★★ | RPC opp: ★★ | App ecosystem: ★★★ (Telegram mini-apps)
- IP access: red — ADNL is UDP-based, non-standard; ASN detection unreliable
- Momentum: Rising (Telegram distribution)
- Red flags: ADNL protocol blocks standard IP/ASN detection; requires custom implementation

### Excluded examples
- **Aptos**: validators accessible, but app ecosystem minimal (★); low DeFi TVL
- **Near**: declining validator momentum; limited OVH fit

---

## Style

- Dark glass: `bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl`
- Accent: `#00F0FF` (cyan)
- Code blocks: `font-mono text-sm bg-black/40 px-3 py-2 rounded`
- Background layers: `BlockchainCubes` + `ParticlesBackground` (same as other pages)
- No new npm dependencies

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/app/roadmap/page.tsx` | Create — main page component |
| `src/components/dashboard/Sidebar.tsx` | Edit — add roadmap link with isLoggedIn guard |


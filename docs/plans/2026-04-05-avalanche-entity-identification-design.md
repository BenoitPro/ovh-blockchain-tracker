# Avalanche Entity Identification — Design Doc

**Date:** 2026-04-05  
**Goal:** Identify the organization behind each Avalanche validator node (like Solana's Marinade + on-chain approach), and remove the "Fee" column from the Avalanche node explorer.

---

## Problem

The Avalanche node explorer currently shows only a truncated `nodeID` as the validator identity — no organization names, no stake amounts, no contact-useful metadata. This makes it impossible to identify which entities (Figment, Everstake, Binance, etc.) run their validators on AWS and should be targeted for migration to OVH.

---

## Architecture

### Data Sources (multi-source cascade, mirrors Solana)

**Source 1 — Glacier API (AvaLabs official, primary)**  
`GET https://glacier-api.avax.network/v1/primaryNetwork/validators?pageSize=100`  
- Paginated, free, no auth required for reasonable use  
- Returns: `nodeId`, `amountStaked`, `delegationFee`, `uptimePerformance`, `rewardAddresses`  
- Does NOT return human names — but gives stake (critical for lead prioritization)

**Source 2 — P-Chain `platform.getCurrentValidators` (canonical stake data)**  
`POST https://api.avax.network/ext/bc/P` → `platform.getCurrentValidators`  
- Already queried for count; extend to extract full data per validator  
- Returns: `nodeID`, `stakeAmount`, `delegationFee`, `rewardOwner`, `uptime`

**Source 3 — Avascan API (community, best name coverage)**  
`GET https://avascan.info/api/v2/staking/validators?limit=100&offset=0`  
- Avascan is the main Avalanche community explorer; their UI shows validator names  
- Likely exposes JSON data similar to Marinade Finance for Solana  
- Fallback: if endpoint unavailable, skip names and show stake + address

**Fallback** — shortened NodeID (last 10 chars, current behavior)

### Priority chain for `name` field
```
Avascan name → formatted NodeID (…XXXXXXXXXX)
```

### Priority chain for `stakeAmount`
```
Glacier API amountStaked → P-Chain stakeAmount → 0
```

---

## Type Changes

`src/types/avalanche.ts` — extend `AvalancheOVHNode`:
```typescript
export interface AvalancheOVHNode extends AvalancheNode {
    ipInfo: AvalancheIPInfo;
    provider?: string;
    name?: string;           // NEW: organization name from Avascan or fallback
    stakeAmount?: string;    // NEW: AVAX staked (nAVAX string, from Glacier/P-Chain)
    delegationFee?: number;  // NEW: 0–100 delegation fee percentage
    rewardAddress?: string;  // NEW: primary reward wallet address
}
```

---

## New Library Files

### `src/lib/avalanche/fetchValidatorInfo.ts`
Single function: `fetchAvalancheValidatorInfo(): Promise<Map<string, AvalancheValidatorMeta>>`

Where `AvalancheValidatorMeta = { name?: string; stakeAmount?: string; delegationFee?: number; rewardAddress?: string }`

Logic:
1. Fetch Glacier API (paginated, collect all pages)
2. Fetch Avascan API for names (if available)
3. Merge: Glacier data is primary for stake; Avascan is primary for names
4. Return map keyed by `nodeID`

---

## Changes to `src/lib/avalanche/getAllNodes.ts`

In `fetchEnrichedAvalancheNodes()`:
1. Call `fetchAvalancheValidatorInfo()` in parallel with `fetchAvalanchePeers()`
2. After enriching each peer with MaxMind, also attach `name`, `stakeAmount`, `delegationFee`, `rewardAddress` from the validator info map
3. Change sort: **stakeAmount descending** (instead of uptime descending) so biggest validators appear first

---

## UI Changes

### `src/components/nodes/AvalancheNodeExplorer.tsx`
- `getName`: return `n.name` if set, else short nodeID (current behavior)  
- `getPrimaryMetric`: use `parseInt(n.stakeAmount || '0')` instead of uptime  
- `formatPrimaryMetric`: show stake in AVAX (divide nAVAX by 1e9, format with commas)  
- `showFeeColumn: false` (new config flag — see below)
- Add `rewardAddress` to CSV export  
- Update search in API route to also search by `name`

### `src/components/nodes/GenericNodeExplorer.tsx`
Add optional config field:
```typescript
showFeeColumn?: boolean;  // default true — set false to hide the Fee/Version column
```
Hide header + cell render when `showFeeColumn === false`.

### `src/app/api/avalanche/nodes/route.ts`
Add `n.name` to search filter.

---

## "Fee" Column Removal

Scoped to Avalanche only. The column is repurposed as "Version" for Avalanche (not meaningful as a fee). Setting `showFeeColumn: false` in `AVAX_CONFIG` hides it. Solana and Sui are unaffected.

---

## Entity Methodology Button

The existing `EntityMethodologyButton` is already rendered via `GenericNodeExplorer`. Its copy currently describes Solana sources. The button content is generic/static — no change needed for Avalanche; a future enhancement could make it chain-aware.

---

## What We Are NOT Doing

- No scraping / HTML parsing of Avascan — only clean JSON API calls
- No caching layer changes (Avalanche nodes API is already `force-dynamic`)
- No changes to dashboard metrics or the cron worker (stake data is explorer-only)
- No changes to Solana or Sui

---

## Success Criteria

1. Avalanche node explorer shows organization names for known validators (target: >30% named, like Solana's coverage before Marinade)
2. Stake amount (AVAX) displayed as primary metric — validators sortable by stake
3. "Fee" column hidden for Avalanche
4. CSV export includes `name` and `rewardAddress` columns (useful for outreach)
5. Search works on organization name

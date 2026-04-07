# UseCasesHero Component — Design

## Problem

The Use Cases pages currently show a stats banner that duplicates Analytics data (OVH market share %, OVH node count, total nodes). The information is either identical to the Analytics page, hardcoded, or broken. It also has to be rebuilt from scratch for every new blockchain.

## Goal

Replace the stats banner with a reusable `UseCasesHero` component that shows contextually relevant info for a Use Cases page: OVH's competitive position on that chain, chain-specific infra requirements OVH satisfies, and a summary of OVH's global infrastructure.

## Design

### Component: `UseCasesHero`

**File:** `src/components/dashboard/UseCasesHero.tsx`

**Props:** `chainId: ChainId`

Client component. On mount, fetches `/api/{chainId}` (or the mapped route), extracts `providerBreakdown`, sorts by `marketShare` descending, excludes the `others` entry, and finds OVH's rank. Renders 4 tiles in a responsive grid.

### 4 Tiles

| # | Tile | Value | Source |
|---|------|-------|--------|
| 1 | OVH Rank | "#2 Cloud Provider on Ethereum" | Live API — rank hidden if > 3 |
| 2 | Tech Highlight 1 | Chain-specific (e.g. "3000+ IOPS NVMe") | Static config |
| 3 | Tech Highlight 2 | Chain-specific (e.g. "Unmetered Bandwidth") | Static config |
| 4 | OVH Infra | "46 DCs · 1.3 Tbit/s Anti-DDoS · NVMe Bare Metal" | Static, same for all chains |

Tile 1 is hidden (not rendered) when OVH rank > 3 to avoid showing a weak position.

### Config file: `src/lib/config/use-cases-config.ts`

Per-chain static config:
```ts
export interface UseCasesChainConfig {
  apiRoute: string;            // e.g. '/api/ethereum'
  techHighlights: [
    { value: string; label: string; sub: string },
    { value: string; label: string; sub: string },
  ];
}
```

### Per-chain highlights (D)

| Chain | Highlight 1 | Highlight 2 |
|-------|-------------|-------------|
| Solana | Sub-10ms Latency | Turbine-Ready Bandwidth |
| Ethereum | Unmetered Bandwidth | 500 GB–4 TB/mo Node Traffic |
| Avalanche | 3000+ IOPS NVMe | High CPU Frequency Required |
| Sui | NVMe SSD Required | Low-Latency Networking |
| Hyperliquid | Ultra-Low Latency | Bare Metal Performance |
| Tron | High Throughput Storage | Enterprise Anti-DDoS |

### OVH rank calculation

```ts
const ranked = providerBreakdown
  .filter(p => p.key !== 'others')
  .sort((a, b) => b.marketShare - a.marketShare);
const ovhRank = ranked.findIndex(p => p.key === 'ovh') + 1;
// hide tile if ovhRank === 0 || ovhRank > 3
```

### Integration

Each use-cases page replaces its current stats `<div>` with:
```tsx
<UseCasesHero chainId="ethereum" />
```

Pages to update: `/use-cases`, `/ethereum/use-cases`, `/avalanche/use-cases`, `/sui/use-cases`, `/hyperliquid/use-cases`, `/tron/use-cases`.

## What changes

- **New file:** `src/lib/config/use-cases-config.ts`
- **New file:** `src/components/dashboard/UseCasesHero.tsx`
- **Updated:** 6 use-cases `page.tsx` files — remove old stats block, add `<UseCasesHero>`

# Data Methodology

## ASN Detection

We use MaxMind GeoLite2-ASN (offline database, <1ms/IP) to map IP addresses to Autonomous System Numbers (ASNs), then classify each node by cloud provider.

### OVH ASN List

| ASN | Description | Source |
|-----|-------------|--------|
| AS16276 | OVH SAS (Main — EU/CA) | RIPE NCC |
| AS35540 | OVH Managed Services | RIPE NCC |
| AS21351 | OVH Public Cloud | RIPE NCC |
| AS198203 | OVH Singapore | RIPE NCC |
| AS50082 | OVH Australia | RIPE NCC |
| AS32790 | OVH USA / Canada | RIPE NCC |

### Known Exclusions & Tradeoffs

**AS14061 — DigitalOcean, NOT OVH**
- AS14061 is registered to DigitalOcean LLC (RIPE NCC, verified 2026-04).
- It was previously included in the OVH list under the assumption it covered "OVH Canada" — this was incorrect.
- Removing it reduces false-positive OVH detections. OVH Canada infrastructure is covered by AS16276 and AS32790.

### Planned Improvements (Phase 2)

- Cross-reference with RIPE IRR (Internet Routing Registry) API for real-time ASN ownership validation.
- OVH publishes its ASN routes on RIPE — this would make the list self-updating rather than manually maintained.

## Ethereum Data Source

Ethereum validator data comes from **MigaLabs** (`migalabs.io`), not from direct RPC crawling.

**Why not direct RPC?**
- Ethereum peer discovery via RPC returns only ~50 neighbors per node. A statistically meaningful global view would require thousands of recursive queries — not scalable.
- MigaLabs runs dedicated crawlers maintaining a continuously updated view of the full validator set.

**Dependency risk:** If MigaLabs API changes format or access policy, Ethereum data collection breaks. Monitor response schema in `src/lib/ethereum/fetchMigalabs.ts`.

## Data Freshness

| Chain | Source | Refresh Frequency | Cache TTL |
|-------|--------|-------------------|-----------|
| Solana | Mainnet RPC | Every 24h (Vercel cron 00:00 UTC) | 1h |
| Ethereum | MigaLabs API | Every 24h (Vercel cron 01:00 UTC) | N/A (snapshots) |
| Avalanche | api.avax.network | Every 24h (Vercel cron 02:00 UTC) | 2h |
| Sui | Sui RPC fullnode | Every 24h (Vercel cron 03:00 UTC) | 2h |
| Tron | TronGrid API | Every 24h (Vercel cron 04:00 UTC) | 2h |
| Hyperliquid | api.hyperliquid.xyz | Every 24h (Vercel cron 05:00 UTC) | 2h |

# Benchmark — Coming Soon Modules

**Date:** 2026-04-04  
**Page:** `/roadmap` (Benchmark)  
**Status:** Approved design, ready for implementation

---

## Context

The Benchmark page (`src/app/roadmap/page.tsx`) is an internal, cookie-protected page showing OVH infrastructure opportunities across blockchain networks. It currently contains a single `RoadmapTable` component with chain-by-chain comparison data.

This design adds 6 "Coming Soon" modules below the table, each showing a mock preview of what the module will eventually display. These are static, purely visual components — no API calls.

---

## Visual Treatment

### Card style
Consistent with the existing table:
```
bg-white/3 border border-white/10 rounded-xl backdrop-blur-sm
```

### "Coming Soon" overlay (hover)
```
absolute inset-0 rounded-xl
bg-black/60 backdrop-blur-[2px]
opacity-0 group-hover:opacity-100 transition-all duration-300
```
Centered badge:
```
text-[10px] font-black uppercase tracking-widest px-3 py-1.5
rounded-full border border-[#00F0FF]/50 bg-[#00F0FF]/10 text-[#00F0FF]
```

### "SAMPLE DATA" watermark
Absolutely positioned, diagonal, non-interactive:
```
absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden
-rotate-12 text-white/5 font-black text-5xl uppercase tracking-widest
```

### Section header
```tsx
<div className="mt-16 mb-8">
  <h2 className="text-xl font-black text-white flex items-center gap-3">
    <span className="w-1 h-6 rounded-full bg-[#00F0FF]" />
    Intelligence Dashboard
  </h2>
  <p className="text-white/30 text-sm mt-1">
    Modules en cours de développement — aperçu des données simulées
  </p>
</div>
```

---

## Layout

```
┌──────────────────────────────────────────────────────┐
│ Intelligence Dashboard                                │
├─────────────────────────┬────────────────────────────┤
│ MarketShareTracker      │ CommunitySentiment         │  half + half
├─────────────────────────┴────────────────────────────┤
│ CompetitorBenchmark                                  │  full width
├──────────────────────────────────────────────────────┤
│ StrategicHeatmap                                     │  full width
├──────────────────────────────────────────────────────┤
│ HighSpendProspecting                                 │  full width
├──────────────────────────────────────────────────────┤
│ RevenueProjection                                    │  full width
└──────────────────────────────────────────────────────┘
```

Tailwind grid:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <MarketShareTracker />
  <CommunitySentiment />
</div>
<div className="mt-4 flex flex-col gap-4">
  <CompetitorBenchmark />
  <StrategicHeatmap />
  <HighSpendProspecting />
  <RevenueProjection />
</div>
```

---

## File structure

```
src/components/benchmark/
├── MarketShareTracker.tsx
├── CommunitySentiment.tsx
├── CompetitorBenchmark.tsx
├── StrategicHeatmap.tsx
├── HighSpendProspecting.tsx
└── RevenueProjection.tsx
```

Each component is a default export, purely client-side (`'use client'`), no props required (all data is hardcoded mock).

Import in `src/app/roadmap/page.tsx` after `<RoadmapTable />`.

---

## Module 1 — MarketShareTracker (half width)

**Purpose:** Dynamic 0–100% OVH market share vs competitors, per chain.

**Mock data (coherent, realistic):**
```
Provider    Solana   Ethereum  Avalanche  Sui
OVHcloud    16.2%    14.8%     13.6%     14.8%
Hetzner     23.8%    18.2%     20.4%     22.1%
AWS         19.4%    21.6%     17.8%     18.3%
Google      9.1%     12.4%     8.9%      10.2%
Others      31.5%    33.0%     39.3%     34.6%
```

**Visual:**
- Horizontal bar chart (custom divs or Recharts `BarChart` horizontal)
- Provider color coding: OVH `#00F0FF`, Hetzner `#F97316`, AWS `#FACC15`, GCP `#3B82F6`, Others `#6B7280`
- Chain selector tabs at top (Solana / Ethereum / Avalanche / Sui) — visually present but no interaction needed (or simple useState toggle)
- OVH row highlighted with subtle cyan left border
- SAMPLE DATA watermark

---

## Module 2 — CommunitySentiment (half width)

**Purpose:** Monitor OVH technical reputation on validator Discord/Telegram communities.

**Mock data:**
```
Chain       Score   Trend    Sources
Solana      74%     +3       Discord: 8 servers, Telegram: 3 groups
Ethereum    61%     →        Discord: 12 servers, Telegram: 5 groups
Avalanche   58%     -2       Discord: 4 servers, Telegram: 2 groups
Sui         43%     -5       Discord: 3 servers, Telegram: 2 groups
```

**Visual:**
- Score gauges or progress bars per chain with color (green >65%, amber 45–65%, red <45%)
- Each chain row is expandable (accordion/dropdown via useState) showing:
  - Source breakdown (Discord % / Telegram % / Twitter %)
  - 3 mock recent mentions (quoted text, source label, date)
  - Topic breakdown: Latency (positive), Pricing (neutral), Support (mixed)
- "Rapport hebdomadaire" collapsible section at bottom with a mock 3-bullet summary
- Tag "12 sources monitored [mock]"

**Mock quotes (per chain):**
```
Solana: "OVH low-latency Frankfurt really solid for Solana validators this month"
        "Had a downtime on OVH Paris but support was responsive"
        "Anyone else seeing better slot times on OVH vs Hetzner?"
Ethereum: "OVH Advance-2 handles attestations well, no issues past 2 weeks"
```

---

## Module 3 — CompetitorBenchmark (full width)

**Purpose:** Real-time ASN comparison vs Hetzner, AWS, GCP across all chains.

**Inspiration:** DeFiLlama chart style — area/bar charts with colored series, chain toggle.

**Mock data:**
```
Provider    Solana  Ethereum  Avalanche  Sui  Hyperliquid
OVHcloud       147     8,240        89   18            3
Hetzner        213    12,380       134   27            5
AWS            189    15,610        98   22            4
GCP             64     5,180        31    9            2
```

**Historical mock (6 months, OVH Solana example):**
```
Oct  Nov  Dec  Jan  Feb  Mar
124  131  138  141  144  147
```

**Visual:**
- Header: chain toggle tabs (All / Solana / Ethereum / Avalanche / Sui)
- Top section: grouped bar chart (Recharts `BarChart`) with provider colors
  - X axis: chains, Y axis: node count
  - Each provider = one colored series
- Middle section: area/line chart showing 6-month evolution for selected chain
  - Multiple lines, one per provider, color-coded
- Bottom section: data table with delta indicators (↑ +12 / ↓ -3 / → 0)
- OVH column highlighted in cyan
- SAMPLE DATA watermark

---

## Module 4 — StrategicHeatmap (full width)

**Purpose:** Cross chains × opportunity types × OVH current presence to define priorities.

**Mock data (score 1–5):**
```
Chain         Validator  RPC Node  App Layer  HW Fit      IP Access  OVH Score
Solana            4          4         3       SCALE-A2       ✓          4.2
Ethereum          5          5         5       Advance-2      ✓          5.0
Avalanche         4          3         3       Advance-2      ✓          3.5
Sui               3          4         2       SCALE-A2       ✓          3.1
Hyperliquid       2          2         4       HFT-grade      ~          2.4
TON               3          2         3       Advance-2      ✗          1.8
```

**Visual:**
- Table with colored cells: score → background intensity (dark green = 5, dark red = 1)
- Color scale: `bg-emerald-500/80` (5) → `bg-emerald-500/30` (4) → `bg-amber-500/20` (3) → `bg-red-500/20` (2) → `bg-red-500/40` (1)
- Hardware fit cell: machine name badge
- IP Access: green/yellow/red dot (reuse existing `IpDot` component)
- Last column "OVH Score" = weighted average, highlighted
- Tooltip on hover per cell showing scoring rationale (mock text)
- SAMPLE DATA watermark

---

## Module 5 — HighSpendProspecting (full width)

**Purpose:** Identify top-tier global validators (500+ nodes) not yet on OVH infrastructure.

**Mock data:**
```
#   Validator             Nodes   Current Provider   Est. ARR       Chain(s)           Priority
1   Chorus One            1,240   AWS                ~$186,000      Sol/ETH/AVAX       HIGH
2   Figment Networks        890   Hetzner            ~$133,500      ETH/SOL            HIGH
3   Everstake               780   Google Cloud       ~$117,000      ETH/AVAX/SOL       HIGH
4   P2P Validator           650   Hetzner            ~$97,500       SOL/ETH            MEDIUM
5   Staking Facilities      520   Bare Metal (DE)    ~$78,000       ETH                MEDIUM
6   InfStones               480   AWS                ~$72,000       Multi-chain        MEDIUM
7   HashQuark               410   Alibaba Cloud      ~$61,500       ETH/SOL            LOW
8   Blockdaemon             380   AWS                ~$57,000       ETH/SOL            LOW
```

**ARR assumption:** avg SCALE-A2 at ~$500/node/month × 12 (conservative, not all nodes are SCALE-A2 tier — stated in footnote).

**Visual:**
- Ranked list table with priority badge (HIGH = emerald, MEDIUM = cyan, LOW = amber)
- Chain badges per validator (colored dots)
- Est. ARR column: gradient text (higher = brighter cyan)
- "Current Provider" column: colored badge per provider
- Filter buttons at top: All / HIGH priority / MEDIUM / LOW
- Footnote: "* Est. ARR = node count × avg SCALE-A2 price (~$500/mo). Actual servers vary. Data simulated."
- SAMPLE DATA watermark

---

## Module 6 — RevenueProjection (full width)

**Purpose:** Revenue impact simulator (ARR/MRR) based on market share growth.

### Block A — Current State (always visible)

**Assumptions panel** (collapsible, open by default):
```
Chains incluses : Solana, Ethereum, Avalanche, Sui (4/11 chains benchmarkées)
Serveur référence par chain :
  • Solana    → SCALE-A2    ~$500/node/mois
  • Ethereum  → Advance-2   ~$150/node/mois  
  • Avalanche → Advance-2   ~$150/node/mois
  • Sui       → SCALE-A2    ~$500/node/mois
Methodology : nodes OVH détectés (ASN) × prix serveur référence
Note : estimation basse — exclut RPC nodes, storage, app nodes, multi-server setups
```

**Current breakdown:**
```
Chain         OVH Nodes   Ref. Server    MRR (est.)    ARR (est.)
Solana              147   SCALE-A2        $73,500       $882,000
Ethereum          8,240   Advance-2    $1,236,000    $14,832,000
Avalanche            89   Advance-2       $13,350       $160,200
Sui                  18   SCALE-A2         $9,000       $108,000
─────────────────────────────────────────────────────────────────
TOTAL                                  $1,331,850    $15,982,200
```

Note: "↓ estimation conservatrice — hors RPC, storage, app nodes"

### Block B — Simulator (sliders)

Two sliders (functional via useState):
- "Part de marché OVH cible" : 16% → 35% (current mock: 16.2%)
- "Croissance annuelle du marché" : 0% → +50% (current mock: +18%/yr)

Output updates live:
```
Scénario sélectionné : 25% market share, +18% croissance
MRR projeté (12m)  : $2,081,700   (+$749,850 vs aujourd'hui)
ARR projeté (12m)  : $24,980,400  (+$8,998,200 vs aujourd'hui)
```

### Block C — 12-month projection chart

Recharts `AreaChart` with two areas:
- "Estimation actuelle" (filled, cyan 20% opacity)
- "Projection scénario" (filled, cyan 40% opacity, dotted border)
- X axis: months (Apr → Mar)
- Y axis: MRR in $k
- Tooltip showing both values per month

---

## Integration in roadmap/page.tsx

After `<RoadmapTable accent={accent} />`, add:

```tsx
import MarketShareTracker from '@/components/benchmark/MarketShareTracker';
import CommunitySentiment from '@/components/benchmark/CommunitySentiment';
import CompetitorBenchmark from '@/components/benchmark/CompetitorBenchmark';
import StrategicHeatmap from '@/components/benchmark/StrategicHeatmap';
import HighSpendProspecting from '@/components/benchmark/HighSpendProspecting';
import RevenueProjection from '@/components/benchmark/RevenueProjection';

// In JSX, after <RoadmapTable />:
<div className="mt-16">
  <div className="mb-8">
    <h2 className="text-xl font-black text-white flex items-center gap-3">
      <span className="w-1 h-6 rounded-full" style={{ background: accent }} />
      Intelligence Dashboard
    </h2>
    <p className="text-white/30 text-sm mt-1">
      Modules en cours de développement — aperçu des données simulées
    </p>
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
    <MarketShareTracker />
    <CommunitySentiment />
  </div>
  <div className="flex flex-col gap-4">
    <CompetitorBenchmark />
    <StrategicHeatmap />
    <HighSpendProspecting />
    <RevenueProjection />
  </div>
</div>
```

---

## Shared ComingSoonCard wrapper

To avoid repeating overlay/watermark logic, create a shared wrapper:

```tsx
// src/components/benchmark/ComingSoonCard.tsx
export function ComingSoonCard({ title, children, className }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative group rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        <span className="-rotate-12 text-white/5 font-black text-5xl uppercase tracking-widest whitespace-nowrap">
          SAMPLE DATA
        </span>
      </div>
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 z-20 rounded-xl bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#00F0FF]/50 bg-[#00F0FF]/10 text-[#00F0FF]">
            Coming Soon
          </span>
          <span className="text-white/40 text-xs">{title}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## Summary

| Module | File | Width | Key lib | Complexity |
|--------|------|-------|---------|------------|
| MarketShareTracker | `MarketShareTracker.tsx` | half | Recharts BarChart | Low |
| CommunitySentiment | `CommunitySentiment.tsx` | half | useState accordion | Medium |
| CompetitorBenchmark | `CompetitorBenchmark.tsx` | full | Recharts BarChart + AreaChart | Medium |
| StrategicHeatmap | `StrategicHeatmap.tsx` | full | Pure HTML table | Low |
| HighSpendProspecting | `HighSpendProspecting.tsx` | full | Pure HTML table | Low |
| RevenueProjection | `RevenueProjection.tsx` | full | Recharts AreaChart + useState | High |

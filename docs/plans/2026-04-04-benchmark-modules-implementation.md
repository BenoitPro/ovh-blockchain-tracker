# Benchmark Intelligence Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 "Coming Soon" mock preview modules below the chain comparison table on the internal Benchmark page (`/roadmap`).

**Architecture:** 7 new files in `src/components/benchmark/` — one shared `ComingSoonCard` wrapper plus one component per module. All components are `'use client'`, purely static mock data, no API calls. Integrated into `src/app/roadmap/page.tsx` after the existing `<RoadmapTable />`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Recharts (already installed), useState for interactive elements (chain toggles, sliders, accordions).

---

## Context for implementer

The Benchmark page lives at `src/app/roadmap/page.tsx`. It's a 563-line file with a `RoadmapPage` component and a `RoadmapTable` sub-component. The page is cookie-protected (redirects to `/` if not logged in). The accent color is `#00F0FF` (cyan). Existing card style: `rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm`.

Recharts is already installed. Import from `'recharts'`.

No tests are needed for these modules — they contain zero business logic (all hardcoded mock data, no functions to unit test).

---

## Task 1: Create the shared ComingSoonCard wrapper

**Files:**
- Create: `src/components/benchmark/ComingSoonCard.tsx`

**Step 1: Create the file**

```tsx
'use client';

import React from 'react';

interface ComingSoonCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ComingSoonCard({ title, description, children, className = '' }: ComingSoonCardProps) {
  return (
    <div className={`relative group rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden ${className}`}>
      {/* SAMPLE DATA watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        <span className="-rotate-12 text-white/[0.04] font-black text-6xl uppercase tracking-widest whitespace-nowrap">
          SAMPLE DATA
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Coming Soon hover overlay */}
      <div className="absolute inset-0 z-20 rounded-xl bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-[#00F0FF]/50 bg-[#00F0FF]/10 text-[#00F0FF]">
            Coming Soon
          </span>
          <span className="text-white/50 text-xs font-medium">{title}</span>
          {description && (
            <span className="text-white/30 text-[11px] text-center max-w-[240px]">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify the file compiles (no runtime needed)**

Check for TypeScript errors by reviewing the file. No imports from non-existent modules.

**Step 3: Commit**

```bash
git add src/components/benchmark/ComingSoonCard.tsx
git commit -m "feat(benchmark): add ComingSoonCard shared wrapper"
```

---

## Task 2: MarketShareTracker component

**Files:**
- Create: `src/components/benchmark/MarketShareTracker.tsx`

**Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ComingSoonCard } from './ComingSoonCard';

const PROVIDER_COLORS: Record<string, string> = {
  OVHcloud: '#00F0FF',
  Hetzner: '#F97316',
  AWS: '#FACC15',
  'Google Cloud': '#3B82F6',
  Others: '#6B7280',
};

const DATA: Record<string, { name: string; value: number }[]> = {
  Solana: [
    { name: 'OVHcloud', value: 16.2 },
    { name: 'Hetzner', value: 23.8 },
    { name: 'AWS', value: 19.4 },
    { name: 'Google Cloud', value: 9.1 },
    { name: 'Others', value: 31.5 },
  ],
  Ethereum: [
    { name: 'OVHcloud', value: 14.8 },
    { name: 'Hetzner', value: 18.2 },
    { name: 'AWS', value: 21.6 },
    { name: 'Google Cloud', value: 12.4 },
    { name: 'Others', value: 33.0 },
  ],
  Avalanche: [
    { name: 'OVHcloud', value: 13.6 },
    { name: 'Hetzner', value: 20.4 },
    { name: 'AWS', value: 17.8 },
    { name: 'Google Cloud', value: 8.9 },
    { name: 'Others', value: 39.3 },
  ],
  Sui: [
    { name: 'OVHcloud', value: 14.8 },
    { name: 'Hetzner', value: 22.1 },
    { name: 'AWS', value: 18.3 },
    { name: 'Google Cloud', value: 10.2 },
    { name: 'Others', value: 34.6 },
  ],
};

const CHAINS = ['Solana', 'Ethereum', 'Avalanche', 'Sui'] as const;

export default function MarketShareTracker() {
  const [activeChain, setActiveChain] = useState<string>('Solana');
  const data = DATA[activeChain];
  const ovhShare = data.find(d => d.name === 'OVHcloud')?.value ?? 0;

  return (
    <ComingSoonCard
      title="Market Share Tracker"
      description="Suivi dynamique de l'empreinte OVH vs concurrents"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">Market Share Tracker</h3>
            <p className="text-white/30 text-[10px] mt-0.5">Répartition par provider infrastructure</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: '#00F0FF' }}>{ovhShare}%</div>
            <div className="text-[9px] text-white/30 uppercase tracking-widest">OVH share</div>
          </div>
        </div>

        {/* Chain tabs */}
        <div className="flex gap-1 mb-5">
          {CHAINS.map(chain => (
            <button
              key={chain}
              onClick={() => setActiveChain(chain)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                activeChain === chain
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                  : 'text-white/30 hover:text-white/60 border border-transparent'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>

        {/* Bar chart */}
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} width={80} />
            <Tooltip
              contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(value: number) => [`${value}%`, 'Share']}
            />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={PROVIDER_COLORS[entry.name] ?? '#6B7280'} opacity={entry.name === 'OVHcloud' ? 1 : 0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <p className="text-[9px] text-white/20 mt-3 italic">* Données simulées basées sur détection ASN</p>
      </div>
    </ComingSoonCard>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/benchmark/MarketShareTracker.tsx
git commit -m "feat(benchmark): add MarketShareTracker coming-soon module"
```

---

## Task 3: CommunitySentiment component

**Files:**
- Create: `src/components/benchmark/CommunitySentiment.tsx`

**Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import { ComingSoonCard } from './ComingSoonCard';

interface Mention {
  text: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface ChainSentiment {
  chain: string;
  color: string;
  score: number;
  trend: number;
  discordSources: number;
  telegramSources: number;
  twitterSources: number;
  topics: { label: string; sentiment: 'positive' | 'neutral' | 'negative' }[];
  mentions: Mention[];
}

const CHAINS_DATA: ChainSentiment[] = [
  {
    chain: 'Solana',
    color: '#9945FF',
    score: 74,
    trend: 3,
    discordSources: 8,
    telegramSources: 3,
    twitterSources: 2,
    topics: [
      { label: 'Latence', sentiment: 'positive' },
      { label: 'Pricing', sentiment: 'neutral' },
      { label: 'Support', sentiment: 'positive' },
    ],
    mentions: [
      { text: 'OVH low-latency Frankfurt really solid for Solana validators this month', source: 'Solana Validators Discord', date: '2 days ago', sentiment: 'positive' },
      { text: 'Had a downtime on OVH Paris but support was responsive', source: 'Solana Tech Telegram', date: '5 days ago', sentiment: 'neutral' },
      { text: 'Anyone else seeing better slot times on OVH vs Hetzner?', source: 'Validators United Discord', date: '1 week ago', sentiment: 'positive' },
    ],
  },
  {
    chain: 'Ethereum',
    color: '#627EEA',
    score: 61,
    trend: 0,
    discordSources: 12,
    telegramSources: 5,
    twitterSources: 4,
    topics: [
      { label: 'Latence', sentiment: 'positive' },
      { label: 'Pricing', sentiment: 'neutral' },
      { label: 'Support', sentiment: 'neutral' },
    ],
    mentions: [
      { text: 'OVH Advance-2 handles attestations well, no issues past 2 weeks', source: 'EthStaker Discord', date: '3 days ago', sentiment: 'positive' },
      { text: 'Comparing OVH vs Hetzner for large ETH validator setups — pricing competitive', source: 'Ethereum Infra Telegram', date: '1 week ago', sentiment: 'neutral' },
      { text: 'OVH IP ranges sometimes flagged by MEV relays, worth checking', source: 'MEV Builders Discord', date: '10 days ago', sentiment: 'negative' },
    ],
  },
  {
    chain: 'Avalanche',
    color: '#E84142',
    score: 58,
    trend: -2,
    discordSources: 4,
    telegramSources: 2,
    twitterSources: 1,
    topics: [
      { label: 'Latence', sentiment: 'neutral' },
      { label: 'Pricing', sentiment: 'positive' },
      { label: 'Support', sentiment: 'neutral' },
    ],
    mentions: [
      { text: 'Using OVH for AVAX validators, uptime has been good', source: 'AVAX Validators Discord', date: '4 days ago', sentiment: 'positive' },
      { text: 'OVH pricing is competitive but bandwidth limits can be an issue for L1s', source: 'Avalanche Infra Telegram', date: '2 weeks ago', sentiment: 'neutral' },
      { text: 'Anyone running Avalanche subnets on OVH? Looking for feedback', source: 'AVAX Builders Discord', date: '2 weeks ago', sentiment: 'neutral' },
    ],
  },
  {
    chain: 'Sui',
    color: '#4DA2FF',
    score: 43,
    trend: -5,
    discordSources: 3,
    telegramSources: 2,
    twitterSources: 1,
    topics: [
      { label: 'Latence', sentiment: 'neutral' },
      { label: 'Pricing', sentiment: 'neutral' },
      { label: 'Support', sentiment: 'negative' },
    ],
    mentions: [
      { text: 'Sui requires high RAM, OVH SCALE range is technically suitable', source: 'Sui Validators Discord', date: '1 week ago', sentiment: 'neutral' },
      { text: 'Not many Sui validators using OVH yet, ecosystem still maturing', source: 'Sui Infra Telegram', date: '2 weeks ago', sentiment: 'neutral' },
      { text: 'OVH network peering not ideal for Sui consensus latency requirements', source: 'Sui Tech Discord', date: '3 weeks ago', sentiment: 'negative' },
    ],
  },
];

function sentimentColor(s: 'positive' | 'neutral' | 'negative') {
  return s === 'positive' ? 'text-emerald-400' : s === 'negative' ? 'text-red-400' : 'text-amber-400';
}

function sentimentBg(s: 'positive' | 'neutral' | 'negative') {
  return s === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : s === 'negative' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400';
}

function scoreColor(score: number) {
  if (score >= 65) return '#10B981';
  if (score >= 45) return '#F59E0B';
  return '#EF4444';
}

export default function CommunitySentiment() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const totalSources = CHAINS_DATA.reduce((sum, c) => sum + c.discordSources + c.telegramSources + c.twitterSources, 0);

  return (
    <ComingSoonCard
      title="Community Sentiment"
      description="Monitoring réputation OVH sur les communautés validateurs"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">Community Sentiment</h3>
            <p className="text-white/30 text-[10px] mt-0.5">{totalSources} sources monitorées [mock]</p>
          </div>
        </div>

        {/* Chain list */}
        <div className="flex flex-col gap-1.5 mb-4">
          {CHAINS_DATA.map(chain => (
            <div key={chain.chain} className="rounded-lg border border-white/5 overflow-hidden">
              {/* Row */}
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/3 transition-colors text-left"
                onClick={() => setExpanded(expanded === chain.chain ? null : chain.chain)}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: chain.color }} />
                <span className="text-xs font-bold text-white w-20">{chain.chain}</span>

                {/* Score bar */}
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${chain.score}%`, background: scoreColor(chain.score) }}
                  />
                </div>

                <span className="text-xs font-black w-8 text-right" style={{ color: scoreColor(chain.score) }}>
                  {chain.score}%
                </span>
                <span className={`text-[10px] w-8 text-right ${chain.trend > 0 ? 'text-emerald-400' : chain.trend < 0 ? 'text-red-400' : 'text-white/30'}`}>
                  {chain.trend > 0 ? `+${chain.trend}` : chain.trend === 0 ? '—' : chain.trend}
                </span>
                <span className="text-white/20 text-xs ml-1">{expanded === chain.chain ? '▲' : '▼'}</span>
              </button>

              {/* Dropdown detail */}
              {expanded === chain.chain && (
                <div className="px-3 pb-3 border-t border-white/5">
                  {/* Sources */}
                  <div className="flex gap-3 mt-2.5 mb-3">
                    <span className="text-[9px] text-white/30">
                      Discord <span className="text-white/60 font-bold">{chain.discordSources}</span>
                    </span>
                    <span className="text-[9px] text-white/30">
                      Telegram <span className="text-white/60 font-bold">{chain.telegramSources}</span>
                    </span>
                    <span className="text-[9px] text-white/30">
                      Twitter <span className="text-white/60 font-bold">{chain.twitterSources}</span>
                    </span>
                  </div>

                  {/* Topics */}
                  <div className="flex gap-1.5 mb-3">
                    {chain.topics.map(t => (
                      <span key={t.label} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sentimentBg(t.sentiment)}`}>
                        {t.label}
                      </span>
                    ))}
                  </div>

                  {/* Mentions */}
                  <div className="flex flex-col gap-2">
                    {chain.mentions.map((m, i) => (
                      <div key={i} className="bg-white/3 rounded-lg p-2.5">
                        <p className="text-[10px] text-white/60 leading-relaxed italic">"{m.text}"</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-bold ${sentimentColor(m.sentiment)}`}>●</span>
                          <span className="text-[9px] text-white/30">{m.source}</span>
                          <span className="text-[9px] text-white/20 ml-auto">{m.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Weekly report */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 hover:bg-white/3 transition-colors"
          onClick={() => setReportOpen(!reportOpen)}
        >
          <span className="text-[10px] font-bold text-white/50">Rapport hebdomadaire [mock]</span>
          <span className="text-white/20 text-xs">{reportOpen ? '▲' : '▼'}</span>
        </button>
        {reportOpen && (
          <div className="mt-2 px-3 py-3 rounded-lg border border-white/5 bg-white/2">
            <ul className="flex flex-col gap-2">
              <li className="text-[10px] text-white/50 leading-relaxed">• Sentiment OVH globalement stable cette semaine. Solana reste le marché le plus positif (74%), porté par les retours sur la latence Frankfurt.</li>
              <li className="text-[10px] text-white/50 leading-relaxed">• Point d'attention sur Ethereum : mention de problèmes de compatibilité avec certains relais MEV. À surveiller.</li>
              <li className="text-[10px] text-white/50 leading-relaxed">• Sui en baisse de 5 points — l'écosystème validateurs est encore petit et les retours sur les performances réseau restent mitigés.</li>
            </ul>
          </div>
        )}
      </div>
    </ComingSoonCard>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/benchmark/CommunitySentiment.tsx
git commit -m "feat(benchmark): add CommunitySentiment coming-soon module"
```

---

## Task 4: CompetitorBenchmark component

**Files:**
- Create: `src/components/benchmark/CompetitorBenchmark.tsx`

**Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { ComingSoonCard } from './ComingSoonCard';

const PROVIDER_COLORS: Record<string, string> = {
  OVH: '#00F0FF',
  Hetzner: '#F97316',
  AWS: '#FACC15',
  GCP: '#3B82F6',
};

const TABLE_DATA = [
  { chain: 'Solana',      color: '#9945FF', OVH: 147,   Hetzner: 213,    AWS: 189,    GCP: 64,   deltaOVH: 12  },
  { chain: 'Ethereum',    color: '#627EEA', OVH: 8240,  Hetzner: 12380,  AWS: 15610,  GCP: 5180, deltaOVH: 95  },
  { chain: 'Avalanche',   color: '#E84142', OVH: 89,    Hetzner: 134,    AWS: 98,     GCP: 31,   deltaOVH: 4   },
  { chain: 'Sui',         color: '#4DA2FF', OVH: 18,    Hetzner: 27,     AWS: 22,     GCP: 9,    deltaOVH: -1  },
  { chain: 'Hyperliquid', color: '#00FF87', OVH: 3,     Hetzner: 5,      AWS: 4,      GCP: 2,    deltaOVH: 0   },
];

// 6-month evolution mock data (for "All" view — OVH nodes across all chains, indexed)
const EVOLUTION_ALL = [
  { month: 'Oct', OVH: 7820, Hetzner: 11240, AWS: 14180, GCP: 4820 },
  { month: 'Nov', OVH: 7990, Hetzner: 11480, AWS: 14520, GCP: 4920 },
  { month: 'Dec', OVH: 8140, Hetzner: 11820, AWS: 14890, GCP: 5010 },
  { month: 'Jan', OVH: 8310, Hetzner: 12140, AWS: 15180, GCP: 5080 },
  { month: 'Fév', OVH: 8430, Hetzner: 12490, AWS: 15440, GCP: 5140 },
  { month: 'Mar', OVH: 8497, Hetzner: 12759, AWS: 15903, GCP: 5286 },
];

const EVOLUTION_BY_CHAIN: Record<string, typeof EVOLUTION_ALL> = {
  Solana: [
    { month: 'Oct', OVH: 124, Hetzner: 186, AWS: 162, GCP: 54 },
    { month: 'Nov', OVH: 131, Hetzner: 191, AWS: 168, GCP: 57 },
    { month: 'Dec', OVH: 138, Hetzner: 198, AWS: 174, GCP: 59 },
    { month: 'Jan', OVH: 141, Hetzner: 204, AWS: 180, GCP: 61 },
    { month: 'Fév', OVH: 144, Hetzner: 209, AWS: 185, GCP: 63 },
    { month: 'Mar', OVH: 147, Hetzner: 213, AWS: 189, GCP: 64 },
  ],
  Ethereum: [
    { month: 'Oct', OVH: 7640, Hetzner: 11020, AWS: 14010, GCP: 4760 },
    { month: 'Nov', OVH: 7810, Hetzner: 11240, AWS: 14290, GCP: 4860 },
    { month: 'Dec', OVH: 7950, Hetzner: 11580, AWS: 14660, GCP: 4950 },
    { month: 'Jan', OVH: 8110, Hetzner: 11890, AWS: 14940, GCP: 5020 },
    { month: 'Fév', OVH: 8180, Hetzner: 12240, AWS: 15210, GCP: 5080 },
    { month: 'Mar', OVH: 8240, Hetzner: 12380, AWS: 15610, GCP: 5180 },
  ],
  Avalanche: [
    { month: 'Oct', OVH: 78, Hetzner: 118, AWS: 86, GCP: 26 },
    { month: 'Nov', OVH: 81, Hetzner: 122, AWS: 89, GCP: 27 },
    { month: 'Dec', OVH: 84, Hetzner: 126, AWS: 91, GCP: 28 },
    { month: 'Jan', OVH: 86, Hetzner: 129, AWS: 94, GCP: 29 },
    { month: 'Fév', OVH: 87, Hetzner: 131, AWS: 96, GCP: 30 },
    { month: 'Mar', OVH: 89, Hetzner: 134, AWS: 98, GCP: 31 },
  ],
};

const CHAINS = ['All', 'Solana', 'Ethereum', 'Avalanche'] as const;

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function CompetitorBenchmark() {
  const [activeChain, setActiveChain] = useState<string>('All');

  const tableRows = activeChain === 'All' ? TABLE_DATA : TABLE_DATA.filter(r => r.chain === activeChain);
  const evolutionData = activeChain === 'All'
    ? EVOLUTION_ALL
    : (EVOLUTION_BY_CHAIN[activeChain] ?? EVOLUTION_ALL);

  // Bar chart data: one entry per chain (or single chain), bars per provider
  const barData = tableRows.map(r => ({
    name: r.chain,
    OVH: r.OVH,
    Hetzner: r.Hetzner,
    AWS: r.AWS,
    GCP: r.GCP,
  }));

  return (
    <ComingSoonCard
      title="Competitor Benchmark"
      description="Comparaison ASN en temps réel vs Hetzner, AWS, GCP"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">Competitor Benchmark</h3>
            <p className="text-white/30 text-[10px] mt-0.5">Nœuds détectés par provider via ASN</p>
          </div>
        </div>

        {/* Chain tabs */}
        <div className="flex gap-1 mb-5 flex-wrap">
          {CHAINS.map(chain => (
            <button
              key={chain}
              onClick={() => setActiveChain(chain)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                activeChain === chain
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                  : 'text-white/30 hover:text-white/60 border border-transparent'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>

        {/* Grouped bar chart */}
        <div className="mb-6">
          <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-2">Répartition actuelle</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(value: number, name: string) => [fmt(value), name]}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              {Object.keys(PROVIDER_COLORS).map(p => (
                <Bar key={p} dataKey={p} fill={PROVIDER_COLORS[p]} opacity={p === 'OVH' ? 1 : 0.65} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolution area chart */}
        <div className="mb-6">
          <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-2">Évolution 6 mois</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={evolutionData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
              <defs>
                {Object.entries(PROVIDER_COLORS).map(([name, color]) => (
                  <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(value: number, name: string) => [fmt(value), name]}
              />
              {Object.entries(PROVIDER_COLORS).map(([name, color]) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={color}
                  strokeWidth={name === 'OVH' ? 2 : 1.5}
                  fill={`url(#grad-${name})`}
                  opacity={name === 'OVH' ? 1 : 0.7}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Data table */}
        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Chain</th>
                {Object.keys(PROVIDER_COLORS).map(p => (
                  <th key={p} className={`px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest ${p === 'OVH' ? 'text-[#00F0FF]/70' : 'text-white/30'}`}>{p}</th>
                ))}
                <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">Δ OVH /7j</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(row => (
                <tr key={row.chain} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                      <span className="text-white/70 font-medium">{row.chain}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-[#00F0FF]">{fmt(row.OVH)}</td>
                  <td className="px-3 py-2 text-right text-white/50">{fmt(row.Hetzner)}</td>
                  <td className="px-3 py-2 text-right text-white/50">{fmt(row.AWS)}</td>
                  <td className="px-3 py-2 text-right text-white/50">{fmt(row.GCP)}</td>
                  <td className={`px-3 py-2 text-right text-[10px] font-bold ${row.deltaOVH > 0 ? 'text-emerald-400' : row.deltaOVH < 0 ? 'text-red-400' : 'text-white/30'}`}>
                    {row.deltaOVH > 0 ? `↑ +${row.deltaOVH}` : row.deltaOVH < 0 ? `↓ ${row.deltaOVH}` : '→ 0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-white/20 mt-2 italic">* Données simulées — détection ASN via MaxMind GeoLite2</p>
      </div>
    </ComingSoonCard>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/benchmark/CompetitorBenchmark.tsx
git commit -m "feat(benchmark): add CompetitorBenchmark coming-soon module"
```

---

## Task 5: StrategicHeatmap component

**Files:**
- Create: `src/components/benchmark/StrategicHeatmap.tsx`

**Step 1: Create the file**

```tsx
'use client';

import { ComingSoonCard } from './ComingSoonCard';

interface ChainRow {
  chain: string;
  color: string;
  validator: number;
  rpc: number;
  app: number;
  hwFit: string;
  ipAccess: 'green' | 'yellow' | 'red';
  ovhScore: number;
  tooltip: string;
}

const ROWS: ChainRow[] = [
  { chain: 'Solana',      color: '#9945FF', validator: 4, rpc: 4, app: 3, hwFit: 'SCALE-A2',  ipAccess: 'green',  ovhScore: 4.2, tooltip: 'Fort potentiel validateurs + RPC. Firedancer peut modifier le profil HW.' },
  { chain: 'Ethereum',    color: '#627EEA', validator: 5, rpc: 5, app: 5, hwFit: 'Advance-2', ipAccess: 'green',  ovhScore: 5.0, tooltip: 'Priorité maximale. 1M+ validateurs, archive RPC = fort revenu storage.' },
  { chain: 'Avalanche',   color: '#E84142', validator: 4, rpc: 3, app: 3, hwFit: 'Advance-2', ipAccess: 'green',  ovhScore: 3.5, tooltip: 'Bonne opportunité validateurs. Subnets peuvent multiplier le count.' },
  { chain: 'Sui',         color: '#4DA2FF', validator: 3, rpc: 4, app: 2, hwFit: 'SCALE-A2',  ipAccess: 'green',  ovhScore: 3.1, tooltip: 'Peu de validateurs mais ARPU élevé (SCALE-A2). Écosystème en croissance.' },
  { chain: 'Hyperliquid', color: '#00FF87', validator: 2, rpc: 2, app: 4, hwFit: 'HFT-grade', ipAccess: 'yellow', ovhScore: 2.4, tooltip: 'Seulement 21 validateurs. Opportunité sur la couche applicative.' },
  { chain: 'TON',         color: '#0088CC', validator: 3, rpc: 2, app: 3, hwFit: 'Advance-2', ipAccess: 'red',    ovhScore: 1.8, tooltip: 'OVH explicitement déconseillé par la TON Foundation (concentration géo).' },
];

const COLUMNS = [
  { key: 'validator', label: 'Validator' },
  { key: 'rpc',       label: 'RPC Node' },
  { key: 'app',       label: 'App Layer' },
];

function scoreCell(score: number): string {
  if (score === 5) return 'bg-emerald-500/70 text-emerald-100';
  if (score === 4) return 'bg-emerald-500/35 text-emerald-300';
  if (score === 3) return 'bg-amber-500/25 text-amber-300';
  if (score === 2) return 'bg-red-500/20 text-red-400';
  return 'bg-red-500/40 text-red-300';
}

function IpDot({ access }: { access: 'green' | 'yellow' | 'red' }) {
  const colors = { green: 'bg-emerald-400', yellow: 'bg-yellow-400', red: 'bg-red-400' };
  const labels = { green: '✓', yellow: '~', red: '✗' };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${colors[access]}/20`}>
      <span className={`text-[10px] font-black ${colors[access].replace('bg-', 'text-')}`}>{labels[access]}</span>
    </span>
  );
}

export default function StrategicHeatmap() {
  return (
    <ComingSoonCard
      title="Strategic Heatmap"
      description="Croisement besoins hardware × présence OVH pour définir les priorités"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-black text-white">Strategic Heatmap</h3>
            <p className="text-white/30 text-[10px] mt-0.5">Score d'opportunité OVH par chain et type de nœud</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-3 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-white/30 w-28">Chain</th>
                {COLUMNS.map(c => (
                  <th key={c.key} className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-white/30">{c.label}</th>
                ))}
                <th className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-white/30">HW Fit</th>
                <th className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-white/30">IP Access</th>
                <th className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[#00F0FF]/50">OVH Score</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(row => (
                <tr key={row.chain} className="border-b border-white/5 hover:bg-white/2 transition-colors group/row" title={row.tooltip}>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                      <span className="text-white/70 font-bold">{row.chain}</span>
                    </span>
                  </td>
                  {COLUMNS.map(c => {
                    const val = row[c.key as keyof typeof row] as number;
                    return (
                      <td key={c.key} className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${scoreCell(val)}`}>
                          {'★'.repeat(val)}<span className="opacity-25">{'★'.repeat(5 - val)}</span>
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    <span className="text-[9px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded">{row.hwFit}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <IpDot access={row.ipAccess} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-sm font-black ${row.ovhScore >= 4 ? 'text-[#00F0FF]' : row.ovhScore >= 3 ? 'text-amber-400' : 'text-red-400/60'}`}>
                      {row.ovhScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-white/20 mt-2 italic">* Survoler une ligne pour voir le raisonnement · OVH Score = moyenne pondérée (Validator 40%, RPC 30%, App 20%, IP 10%)</p>
      </div>
    </ComingSoonCard>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/benchmark/StrategicHeatmap.tsx
git commit -m "feat(benchmark): add StrategicHeatmap coming-soon module"
```

---

## Task 6: HighSpendProspecting component

**Files:**
- Create: `src/components/benchmark/HighSpendProspecting.tsx`

**Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import { ComingSoonCard } from './ComingSoonCard';

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface Validator {
  rank: number;
  name: string;
  nodes: number;
  currentProvider: string;
  providerColor: string;
  estArr: number;
  chains: { name: string; color: string }[];
  priority: Priority;
}

const VALIDATORS: Validator[] = [
  { rank: 1, name: 'Chorus One',          nodes: 1240, currentProvider: 'AWS',              providerColor: '#FACC15', estArr: 186000, chains: [{ name: 'SOL', color: '#9945FF' }, { name: 'ETH', color: '#627EEA' }, { name: 'AVAX', color: '#E84142' }], priority: 'HIGH' },
  { rank: 2, name: 'Figment Networks',    nodes: 890,  currentProvider: 'Hetzner',           providerColor: '#F97316', estArr: 133500, chains: [{ name: 'ETH', color: '#627EEA' }, { name: 'SOL', color: '#9945FF' }], priority: 'HIGH' },
  { rank: 3, name: 'Everstake',           nodes: 780,  currentProvider: 'Google Cloud',      providerColor: '#3B82F6', estArr: 117000, chains: [{ name: 'ETH', color: '#627EEA' }, { name: 'AVAX', color: '#E84142' }, { name: 'SOL', color: '#9945FF' }], priority: 'HIGH' },
  { rank: 4, name: 'P2P Validator',       nodes: 650,  currentProvider: 'Hetzner',           providerColor: '#F97316', estArr: 97500,  chains: [{ name: 'SOL', color: '#9945FF' }, { name: 'ETH', color: '#627EEA' }], priority: 'MEDIUM' },
  { rank: 5, name: 'Staking Facilities',  nodes: 520,  currentProvider: 'Bare Metal (DE)',   providerColor: '#6B7280', estArr: 78000,  chains: [{ name: 'ETH', color: '#627EEA' }], priority: 'MEDIUM' },
  { rank: 6, name: 'InfStones',           nodes: 480,  currentProvider: 'AWS',               providerColor: '#FACC15', estArr: 72000,  chains: [{ name: 'SOL', color: '#9945FF' }, { name: 'ETH', color: '#627EEA' }, { name: 'AVAX', color: '#E84142' }], priority: 'MEDIUM' },
  { rank: 7, name: 'HashQuark',           nodes: 410,  currentProvider: 'Alibaba Cloud',     providerColor: '#F87171', estArr: 61500,  chains: [{ name: 'ETH', color: '#627EEA' }, { name: 'SOL', color: '#9945FF' }], priority: 'LOW' },
  { rank: 8, name: 'Blockdaemon',         nodes: 380,  currentProvider: 'AWS',               providerColor: '#FACC15', estArr: 57000,  chains: [{ name: 'ETH', color: '#627EEA' }, { name: 'SOL', color: '#9945FF' }], priority: 'LOW' },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  LOW:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function fmtArr(n: number) {
  return `~$${(n / 1000).toFixed(0)}k/yr`;
}

type Filter = 'ALL' | Priority;

export default function HighSpendProspecting() {
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered = filter === 'ALL' ? VALIDATORS : VALIDATORS.filter(v => v.priority === filter);

  const totalArr = filtered.reduce((s, v) => s + v.estArr, 0);
  const totalNodes = filtered.reduce((s, v) => s + v.nodes, 0);

  return (
    <ComingSoonCard
      title="High-Spend Prospecting"
      description="Validateurs top-tier (500+ nœuds) pas encore chez OVH"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">High-Spend Prospecting</h3>
            <p className="text-white/30 text-[10px] mt-0.5">Top validateurs mondiaux — potentiel de migration OVH</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-[#00F0FF]">${(totalArr / 1000).toFixed(0)}k</div>
            <div className="text-[9px] text-white/30 uppercase tracking-widest">ARR potentiel</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 mb-4">
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                filter === f
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                  : 'text-white/30 hover:text-white/60 border border-transparent'
              }`}
            >
              {f === 'ALL' ? `Tous (${VALIDATORS.length})` : `${f} (${VALIDATORS.filter(v => v.priority === f).length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30 w-6">#</th>
                <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Validateur</th>
                <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">Nœuds</th>
                <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Provider actuel</th>
                <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Chains</th>
                <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-[#00F0FF]/50">Est. ARR</th>
                <th className="px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest text-white/30">Priorité</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.rank} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-3 py-2.5 text-white/20 font-mono text-[10px]">{v.rank}</td>
                  <td className="px-3 py-2.5 font-bold text-white/80">{v.name}</td>
                  <td className="px-3 py-2.5 text-right text-white/60 font-mono">{v.nodes.toLocaleString()}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5" style={{ color: v.providerColor }}>
                      {v.currentProvider}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {v.chains.map(c => (
                        <span key={c.name} className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: `${c.color}20`, color: c.color }}>
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-black text-[#00F0FF] text-[11px]">{fmtArr(v.estArr)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[v.priority]}`}>
                      {v.priority}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t border-white/10 bg-white/2">
                <td colSpan={2} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/30">
                  Total ({filtered.length} validateurs)
                </td>
                <td className="px-3 py-2 text-right font-black text-white/60">{totalNodes.toLocaleString()}</td>
                <td colSpan={2} />
                <td className="px-3 py-2 text-right font-black text-[#00F0FF]">${(totalArr / 1000).toFixed(0)}k/yr</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-white/20 mt-2 italic">
          * Est. ARR = nœuds × ~$500/mois (SCALE-A2 ref). Serveurs réels varient selon chain et usage. Données simulées.
        </p>
      </div>
    </ComingSoonCard>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/benchmark/HighSpendProspecting.tsx
git commit -m "feat(benchmark): add HighSpendProspecting coming-soon module"
```

---

## Task 7: RevenueProjection component

**Files:**
- Create: `src/components/benchmark/RevenueProjection.tsx`

**Step 1: Create the file**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { ComingSoonCard } from './ComingSoonCard';

// ── Current state (detected OVH nodes × reference server price) ──
const CHAIN_BREAKDOWN = [
  { chain: 'Solana',    color: '#9945FF', nodes: 147,  serverRef: 'SCALE-A2',  pricePerMonth: 500,  included: true },
  { chain: 'Ethereum',  color: '#627EEA', nodes: 8240, serverRef: 'Advance-2', pricePerMonth: 150,  included: true },
  { chain: 'Avalanche', color: '#E84142', nodes: 89,   serverRef: 'Advance-2', pricePerMonth: 150,  included: true },
  { chain: 'Sui',       color: '#4DA2FF', nodes: 18,   serverRef: 'SCALE-A2',  pricePerMonth: 500,  included: true },
  { chain: 'Hyperliquid', color: '#00FF87', nodes: 3,  serverRef: 'HFT-grade', pricePerMonth: 800,  included: false },
  { chain: 'TON',       color: '#0088CC', nodes: 0,    serverRef: 'Advance-2', pricePerMonth: 150,  included: false },
];

const MONTHS = ['Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];

// Historical mock (last 6 months before current, indexed by MRR in $k)
const HISTORICAL = [
  { month: 'Oct\'25', mrr: 1089 },
  { month: 'Nov\'25', mrr: 1148 },
  { month: 'Déc\'25', mrr: 1198 },
  { month: 'Jan\'26', mrr: 1242 },
  { month: 'Fév\'26', mrr: 1288 },
  { month: 'Mar\'26', mrr: 1332 },
];

function buildProjection(currentMrr: number, targetSharePct: number, currentSharePct: number, marketGrowthPct: number) {
  return MONTHS.map((month, i) => {
    const t = (i + 1) / 12;
    // Market grows linearly
    const marketMultiplier = 1 + (marketGrowthPct / 100) * t;
    // OVH share grows toward target linearly
    const shareMultiplier = 1 + ((targetSharePct - currentSharePct) / currentSharePct) * t;
    const projected = Math.round(currentMrr * marketMultiplier * shareMultiplier);
    const baseline = Math.round(currentMrr * marketMultiplier);
    return { month, projected, baseline };
  });
}

export default function RevenueProjection() {
  const [targetShare, setTargetShare] = useState(25);
  const [marketGrowth, setMarketGrowth] = useState(18);
  const [assumptionsOpen, setAssumptionsOpen] = useState(true);

  const includedChains = CHAIN_BREAKDOWN.filter(c => c.included);
  const currentMrr = includedChains.reduce((sum, c) => sum + c.nodes * c.pricePerMonth, 0);
  const currentArr = currentMrr * 12;
  const currentSharePct = 16.2;

  const projectionData = useMemo(
    () => buildProjection(currentMrr, targetShare, currentSharePct, marketGrowth),
    [currentMrr, targetShare, marketGrowth]
  );

  const projectedMrr = projectionData[11].projected;
  const projectedArr = projectedMrr * 12;
  const deltaMrr = projectedMrr - currentMrr;
  const deltaArr = projectedArr - currentArr;
  const deltaArrPct = Math.round((deltaArr / currentArr) * 100);

  // Combined chart: historical + projection
  const chartData = [
    ...HISTORICAL.map(h => ({ month: h.month, actual: h.mrr, projected: null as number | null, baseline: null as number | null })),
    { month: 'Mar\'26*', actual: Math.round(currentMrr / 1000), projected: Math.round(currentMrr / 1000), baseline: Math.round(currentMrr / 1000) },
    ...projectionData.map(p => ({ month: p.month, actual: null as number | null, projected: Math.round(p.projected / 1000), baseline: Math.round(p.baseline / 1000) })),
  ];

  function fmtK(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`; }

  return (
    <ComingSoonCard
      title="Revenue Projection"
      description="Simulateur d'impact CA selon la croissance des parts de marché"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-black text-white">Revenue Projection</h3>
            <p className="text-white/30 text-[10px] mt-0.5">Estimation basse — nœuds validateurs uniquement (hors RPC, storage, app)</p>
          </div>
        </div>

        {/* Block A: Assumptions */}
        <div className="mb-5 rounded-xl border border-white/5 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors"
            onClick={() => setAssumptionsOpen(!assumptionsOpen)}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Hypothèses & méthodologie</span>
            <span className="text-white/20 text-xs">{assumptionsOpen ? '▲' : '▼'}</span>
          </button>
          {assumptionsOpen && (
            <div className="px-4 pb-4 border-t border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2">Chains incluses</p>
                  <div className="flex flex-col gap-1.5">
                    {CHAIN_BREAKDOWN.map(c => (
                      <div key={c.chain} className={`flex items-center gap-2 ${!c.included ? 'opacity-35' : ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-[10px] text-white/60 w-20">{c.chain}</span>
                        <span className="text-[9px] font-bold text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{c.serverRef}</span>
                        <span className="text-[9px] text-white/40 ml-auto">${c.pricePerMonth}/mo</span>
                        {!c.included && <span className="text-[8px] text-red-400/50 italic">exclu</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2">Méthodologie</p>
                  <ul className="flex flex-col gap-1.5">
                    <li className="text-[10px] text-white/40 leading-relaxed">• Nœuds OVH détectés via ASN MaxMind × prix serveur de référence par chain</li>
                    <li className="text-[10px] text-white/40 leading-relaxed">• Serveur de référence = machine OVH recommandée pour ce type de nœud</li>
                    <li className="text-[10px] text-white/40 leading-relaxed">• Exclut : RPC nodes, storage additionnel, app nodes, setups multi-serveurs</li>
                    <li className="text-[10px] text-white/40 leading-relaxed">• Hyperliquid et TON exclus (detection ASN peu fiable ou OVH déconseillé)</li>
                    <li className="text-[10px] text-white/40 leading-relaxed">• Part de marché actuelle OVH : 16.2% (estimation Solana)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Block B: Current state breakdown */}
        <div className="mb-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-3">État actuel estimé</p>
          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Chain</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">Nœuds OVH</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Serveur réf.</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">MRR (est.)</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">ARR (est.)</th>
                </tr>
              </thead>
              <tbody>
                {includedChains.map(c => {
                  const mrr = c.nodes * c.pricePerMonth;
                  return (
                    <tr key={c.chain} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                          <span className="text-white/70 font-medium">{c.chain}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-white/50 font-mono">{c.nodes.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{c.serverRef}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-white/60 font-mono">{fmtK(mrr)}</td>
                      <td className="px-3 py-2 text-right text-white/50 font-mono">{fmtK(mrr * 12)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-white/10 bg-white/2">
                  <td colSpan={3} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/30">Total</td>
                  <td className="px-3 py-2 text-right font-black text-[#00F0FF]">{fmtK(currentMrr)}/mo</td>
                  <td className="px-3 py-2 text-right font-black text-[#00F0FF]">{fmtK(currentArr)}/yr</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[9px] text-white/20 mt-1.5 italic">↓ estimation conservatrice — hors RPC, storage, app nodes</p>
        </div>

        {/* Block C: Simulator */}
        <div className="mb-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-4">Simulateur de scénario (12 mois)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
            {/* Slider 1 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-white/50">Part de marché OVH cible</label>
                <span className="text-sm font-black text-[#00F0FF]">{targetShare}%</span>
              </div>
              <input
                type="range" min={17} max={45} step={1}
                value={targetShare}
                onChange={e => setTargetShare(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #00F0FF ${((targetShare - 17) / 28) * 100}%, rgba(255,255,255,0.1) ${((targetShare - 17) / 28) * 100}%)` }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-white/25">actuel: 16.2%</span>
                <span className="text-[9px] text-white/25">max: 45%</span>
              </div>
            </div>

            {/* Slider 2 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-white/50">Croissance annuelle du marché</label>
                <span className="text-sm font-black text-[#00F0FF]">+{marketGrowth}%</span>
              </div>
              <input
                type="range" min={0} max={50} step={1}
                value={marketGrowth}
                onChange={e => setMarketGrowth(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #00F0FF ${(marketGrowth / 50) * 100}%, rgba(255,255,255,0.1) ${(marketGrowth / 50) * 100}%)` }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-white/25">0%</span>
                <span className="text-[9px] text-white/25">+50%</span>
              </div>
            </div>
          </div>

          {/* Scenario output */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'MRR actuel', value: fmtK(currentMrr), sub: '/mois' },
              { label: 'ARR actuel', value: fmtK(currentArr), sub: '/an' },
              { label: `MRR projeté (12m)`, value: fmtK(projectedMrr), sub: `+${fmtK(deltaMrr)}`, highlight: true },
              { label: `ARR projeté (12m)`, value: fmtK(projectedArr), sub: `+${deltaArrPct}% ↑`, highlight: true },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-3 border ${item.highlight ? 'border-[#00F0FF]/20 bg-[#00F0FF]/5' : 'border-white/5 bg-white/2'}`}>
                <div className={`text-lg font-black ${item.highlight ? 'text-[#00F0FF]' : 'text-white'}`}>{item.value}</div>
                <div className="text-[9px] text-white/30 mt-0.5">{item.label}</div>
                <div className={`text-[9px] mt-0.5 ${item.highlight ? 'text-emerald-400' : 'text-white/20'}`}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Chart: historical + projection */}
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B7280" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tickFormatter={v => `$${v}k`} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(value: number | null, name: string) => value ? [`$${value}k/mo`, name === 'actual' ? 'Historique' : name === 'projected' ? 'Projection scénario' : 'Croissance marché seule'] : ['-']}
              />
              <ReferenceLine x="Mar'26*" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" label={{ value: 'Auj.', fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
              <Area type="monotone" dataKey="actual" stroke="#00F0FF" strokeWidth={2} fill="url(#gradActual)" connectNulls={false} dot={false} />
              <Area type="monotone" dataKey="baseline" stroke="#6B7280" strokeWidth={1} strokeDasharray="4 4" fill="url(#gradBaseline)" connectNulls={false} dot={false} />
              <Area type="monotone" dataKey="projected" stroke="#00F0FF" strokeWidth={2} strokeDasharray="6 3" fill="url(#gradProjected)" connectNulls={false} dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[9px] text-white/30"><span className="w-4 h-0.5 bg-[#00F0FF] inline-block" />Historique</span>
            <span className="flex items-center gap-1.5 text-[9px] text-white/30"><span className="w-4 h-0.5 bg-[#00F0FF] inline-block opacity-60 border-t border-dashed border-[#00F0FF]" />Projection scénario</span>
            <span className="flex items-center gap-1.5 text-[9px] text-white/30"><span className="w-4 h-0.5 bg-gray-500 inline-block opacity-60" />Croissance marché seule</span>
          </div>
        </div>

        <p className="text-[9px] text-white/20 italic">* Données simulées. Estimation conservative excluant RPC, storage et app nodes.</p>
      </div>
    </ComingSoonCard>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/benchmark/RevenueProjection.tsx
git commit -m "feat(benchmark): add RevenueProjection coming-soon module"
```

---

## Task 8: Integrate all modules into roadmap/page.tsx

**Files:**
- Modify: `src/app/roadmap/page.tsx`

**Step 1: Add imports at the top of the file**

After the existing imports (`import BlockchainCubes...`, `import ParticlesBackground...`), add:

```tsx
import MarketShareTracker from '@/components/benchmark/MarketShareTracker';
import CommunitySentiment from '@/components/benchmark/CommunitySentiment';
import CompetitorBenchmark from '@/components/benchmark/CompetitorBenchmark';
import StrategicHeatmap from '@/components/benchmark/StrategicHeatmap';
import HighSpendProspecting from '@/components/benchmark/HighSpendProspecting';
import RevenueProjection from '@/components/benchmark/RevenueProjection';
```

**Step 2: Add the Intelligence Dashboard section**

In `RoadmapPage`, after `<RoadmapTable accent={accent} />`, add:

```tsx
{/* Intelligence Dashboard — Coming Soon modules */}
<div className="mt-16">
  <div className="mb-8">
    <h2 className="text-xl font-black text-white flex items-center gap-3">
      <span className="w-1 h-6 rounded-full" style={{ background: accent }} />
      Intelligence Dashboard
    </h2>
    <p className="text-white/30 text-sm mt-1">
      Modules en cours de développement — survolez pour voir le statut
    </p>
  </div>

  {/* Row 1: half + half */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
    <MarketShareTracker />
    <CommunitySentiment />
  </div>

  {/* Rows 2-5: full width */}
  <div className="flex flex-col gap-4">
    <CompetitorBenchmark />
    <StrategicHeatmap />
    <HighSpendProspecting />
    <RevenueProjection />
  </div>
</div>
```

**Step 3: Verify the build**

```bash
cd ovh-blockchain-tracker && npm run build 2>&1 | tail -20
```

Expected: build completes without TypeScript or import errors.

**Step 4: Commit**

```bash
git add src/app/roadmap/page.tsx
git commit -m "feat(benchmark): integrate Intelligence Dashboard modules into roadmap page"
```

---

## Final verification

Start the dev server and navigate to `/roadmap` (requires login cookie):

```bash
npm run dev
```

Check:
- [ ] Section "Intelligence Dashboard" appears below the chain comparison table
- [ ] Row 1: MarketShareTracker and CommunitySentiment side by side (on lg screens)
- [ ] Chain toggle works in MarketShareTracker
- [ ] Accordion rows expand in CommunitySentiment
- [ ] Charts render in CompetitorBenchmark with correct colors
- [ ] Heatmap table shows colored score cells
- [ ] Filter buttons work in HighSpendProspecting
- [ ] Sliders update the projected values and chart in RevenueProjection
- [ ] Hovering any card shows the "Coming Soon" overlay
- [ ] "SAMPLE DATA" watermark visible on each card

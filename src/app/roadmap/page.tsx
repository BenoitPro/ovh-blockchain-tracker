'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ParticlesBackground from '@/components/ParticlesBackground';
import MarketShareTracker from '@/components/benchmark/MarketShareTracker';
import CommunitySentiment from '@/components/benchmark/CommunitySentiment';
import CompetitorBenchmark from '@/components/benchmark/CompetitorBenchmark';
import StrategicHeatmap from '@/components/benchmark/StrategicHeatmap';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OpportunityScore = 1 | 2 | 3 | 4 | 5;
type IpAccess = 'green' | 'yellow' | 'red';
type OvhInterest = 'High' | 'Medium' | 'Low' | 'Skip';
type Momentum = 'Rising' | 'Stable' | 'Declining';

interface ChainRow {
  id: string;
  name: string;
  color: string;
  tier: 1 | 2 | 3 | 4;
  validators: string;
  hardware: string;         // condensed validator specs
  rpcSpecs: string;         // condensed full/RPC node specs
  validatorOpp: OpportunityScore;
  rpcOpp: OpportunityScore;
  appOpp: OpportunityScore;
  appEcosystem: string;
  ipAccess: IpAccess;
  ipNote: string;
  momentum: Momentum;
  ovhInterest: OvhInterest;
  ovhServer: string;        // recommended OVH server
  priceEst: string;         // estimated ARPU for validator node
  interestNote?: string;
  caveat?: string;          // ⚠️ important warnings
}

// ---------------------------------------------------------------------------
// Data  — last updated: April 2026
// ---------------------------------------------------------------------------

const CHAIN_DATA: ChainRow[] = [
  // ── Tier 1 — Live (tracked) ──────────────────────────────────────────
  {
    id: 'solana',
    name: 'Solana',
    color: '#9945FF',
    tier: 1,
    validators: '~850',
    hardware: '24c+ (AVX512) · 512 GB ECC · 2+1 TB NVMe (2 discs) · 1 Gbps+',
    rpcSpecs: 'Full index: 512 GB RAM · 2+1 TB NVMe · 1 Gbps+ / Light: 128 GB · 1 TB NVMe',
    validatorOpp: 4,
    rpcOpp: 4,
    appOpp: 3,
    appEcosystem: 'Jito, Kamino, Drift, Jupiter',
    ipAccess: 'green',
    ipNote: 'Public RPC, standard IP/ASN',
    momentum: 'Rising',
    ovhInterest: 'High',
    ovhServer: 'SCALE-a2',
    priceEst: '~€1,066/mo',
    interestNote: 'Firedancer live Dec 2025; 10 Gbps preferred in production',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    color: '#627EEA',
    tier: 1,
    validators: '~1,070,000',
    hardware: '4c+ · 32 GB · 2 TB SSD · 25 Mbps+ (validator + consensus client)',
    rpcSpecs: 'Archive Erigon/Reth: 32 GB · 2.5–4 TB NVMe (~€367) / Geth: 64 GB+ · 12–15 TB (~€481)',
    validatorOpp: 5,
    rpcOpp: 5,
    appOpp: 5,
    appEcosystem: 'Morpho, Aave, Uniswap, Lido, EigenLayer',
    ipAccess: 'green',
    ipNote: 'Public RPC, standard IP/ASN',
    momentum: 'Stable',
    ovhInterest: 'High',
    ovhServer: 'ADVANCE-2',
    priceEst: '~€125/mo (val.) · €481/mo (archive Geth) · €367/mo (archive Erigon)',
    interestNote: 'Massive node count; archive RPC = high-ARPU storage opportunity',
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    color: '#E84142',
    tier: 1,
    validators: '~656',
    hardware: '8c rec. (4c min) · 32 GB rec. · 2 TB NVMe local (≥3k IOPS) · 100 Mbps min / 1 Gbps rec.',
    rpcSpecs: '8c · 32 GB · 2 TB NVMe local · 100 Mbps min — same profile as validator',
    validatorOpp: 4,
    rpcOpp: 3,
    appOpp: 3,
    appEcosystem: 'Trader Joe, Benqi, GMX (C-Chain)',
    ipAccess: 'green',
    ipNote: 'Public HTTP API',
    momentum: 'Rising',
    ovhInterest: 'Medium',
    ovhServer: 'ADVANCE-2',
    priceEst: '~€125/mo',
    interestNote: 'ADVANCE-2 already covers rec. specs; L1s/Subnets = 1 AvalancheGo process only (post-Etna)',
  },
  {
    id: 'sui',
    name: 'Sui',
    color: '#4DA2FF',
    tier: 1,
    validators: '~122',
    hardware: '24c · 128 GB · 4 TB NVMe · 1 Gbps (min) → 384 GB · 10 TB+ NVMe (prod. rec.)',
    rpcSpecs: '16c · 128 GB · ~2.5 TB NVMe · 500 Mbps+ (pruned + indexes)',
    validatorOpp: 3,
    rpcOpp: 4,
    appOpp: 2,
    appEcosystem: 'Cetus, Navi (ecosystem early stage)',
    ipAccess: 'green',
    ipNote: 'JSON-RPC public',
    momentum: 'Rising',
    ovhInterest: 'Medium',
    ovhServer: 'SCALE-a2',
    priceEst: '~€530/mo (min) · ~€1,066/mo (prod.)',
    interestNote: 'High ARPU per node; validator set small (~122) and permissioned',
  },
  {
    id: 'tron',
    name: 'Tron',
    color: '#EF0027',
    tier: 1,
    validators: '27 SRs + ~200 SR candidates',
    hardware: 'SR block producer: 32c · 64 GB · 3.5 TB+ NVMe · 100 Mbps',
    rpcSpecs: 'Full node: 16c (min 8c) · 32 GB · 3.5 TB+ SSD · 100 Mbps',
    validatorOpp: 3,
    rpcOpp: 4,
    appOpp: 2,
    appEcosystem: 'USDT on Tron, JustLend, SunSwap',
    ipAccess: 'green',
    ipNote: 'Public API standard',
    momentum: 'Stable',
    ovhInterest: 'High',
    ovhServer: 'SCALE-a3 (SR) / ADVANCE-3 (full)',
    priceEst: '~€730/mo (SR) · ~€252/mo (full)',
    interestNote: '8,000+ full nodes = large addressable market beyond just 27 SRs',
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    color: '#00FF87',
    tier: 1,
    validators: 'Top 24 (permissionless, min 10k HYPE stake)',
    hardware: '32 vCPU · 128 GB · 1 TB SSD · stable low-latency connection',
    rpcSpecs: 'API / non-validator: 16 vCPU · 64 GB · 500 GB SSD',
    validatorOpp: 2,
    rpcOpp: 2,
    appOpp: 4,
    appEcosystem: 'Native perps DEX (large TVL), HIP-1/HIP-2 token launches',
    ipAccess: 'yellow',
    ipNote: 'Limited public API',
    momentum: 'Rising',
    ovhInterest: 'Low',
    ovhServer: 'SCALE-a1',
    priceEst: '~€510/mo',
    caveat: '⚠️ Tokyo latency required — OVH nearest DC = Singapore',
    interestNote: 'Only 24 validator slots; app-layer opportunity > infra opportunity',
  },
  // ── Tier 2 — High Interest ─────────────────────────────────────────────
  {
    id: 'polkadot',
    name: 'Polkadot',
    color: '#E6007A',
    tier: 2,
    validators: '600 active + ~700 waiting (NPoS rotation)',
    hardware: '8c physical @ ≥3.4 GHz · 32 GB ECC · 2 TB NVMe · 500 Mbps sym.',
    rpcSpecs: 'Full/RPC: 4–8c · 64–128 GB · ~200 GB NVMe (pruned) / Archive: 4.2 TB NVMe',
    validatorOpp: 4,
    rpcOpp: 3,
    appOpp: 2,
    appEcosystem: 'Acala, Moonbeam, Astar + parachain collators',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Stable',
    ovhInterest: 'High',
    ovhServer: 'ADVANCE-2',
    priceEst: '~€125/mo (val.) · ~€263/mo (archive)',
    caveat: '⚠️ Disable SMT (Hyper-Threading) on validators — single-thread perf critical',
    interestNote: 'Web3 Foundation (Zug) + Parity (Berlin) — EU-native; 600+ val. × parachain collator multiplier',
  },
  {
    id: 'celestia',
    name: 'Celestia',
    color: '#7B2FBE',
    tier: 2,
    validators: '~100 active (~294 registered)',
    hardware: '32c (GFNI+SHA-NI req.) · 32 GB · 12 TiB NVMe · 1 Gbps sym. (non-archival)',
    rpcSpecs: 'Bridge node: 32c · 64 GB · 25 TiB NVMe · 1 Gbps / Light node: 1c · <1 GB · 20 GB',
    validatorOpp: 4,
    rpcOpp: 4,
    appOpp: 2,
    appEcosystem: 'DA layer for Arbitrum, OP Stack, Eclipse rollups',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Rising',
    ovhInterest: 'High',
    ovhServer: 'SCALE-a3',
    priceEst: '~€686/mo (val.) · ~€870/mo (bridge)',
    caveat: '⚠️ Archive non-viable (~624 TiB) — non-archival mode only on dedicated',
    interestNote: 'Storage-intensive even non-archival → SCALE-a3 mandatory; high ARPU angle',
  },
  {
    id: 'aptos',
    name: 'Aptos',
    color: '#00BFA5',
    tier: 2,
    validators: '114 active',
    hardware: '24c/48t · 128 GB · 3 TB NVMe (≥60k IOPS) · 1 Gbps',
    rpcSpecs: 'Public Full Node (same specs as VFN): 24c/48t · 128 GB · 3 TB NVMe · 1 Gbps',
    validatorOpp: 4,
    rpcOpp: 4,
    appOpp: 1,
    appEcosystem: 'Liquid staking, DeFi (low TVL vs ETH/BNB)',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Stable',
    ovhInterest: 'High',
    ovhServer: 'SCALE-a2 × 2',
    priceEst: '~€530/mo × 2 (validator + VFN mandatory)',
    caveat: '⚠️ Validator + VFN = 2 separate machines (network isolation required)',
    interestNote: '~€120k MRR potential at 100% capture (114 val. × €1,060); Block-STM v2 at ~30k TPS',
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    color: '#F0B90B',
    tier: 2,
    validators: '~45 (Cabinet ~21 + Candidates ~24)',
    hardware: '16c+ · 128 GB · 7 TB NVMe (40k IOPS) · 512 Mbps+ (Fermi fork, Jan 2026)',
    rpcSpecs: 'Fast RPC: 16c · 32 GB · 2 TB SSD / Standard: 16c · 64 GB · 3 TB SSD',
    validatorOpp: 3,
    rpcOpp: 5,
    appOpp: 3,
    appEcosystem: 'PancakeSwap, Venus, Lista DAO',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Stable',
    ovhInterest: 'Medium',
    ovhServer: 'SCALE-a1 (val.) / ADVANCE-2 (RPC)',
    priceEst: '~€510/mo (val.) · ~€125–167/mo (RPC)',
    interestNote: 'Fermi fork significantly raised validator HW; large RPC node market = main opportunity',
  },
  // ── Tier 3 — Medium Interest ───────────────────────────────────────────
  {
    id: 'polygon',
    name: 'Polygon PoS',
    color: '#7B3FE4',
    tier: 3,
    validators: '~100',
    hardware: '8–16c · 32–64 GB · 4–6 TB SSD · 1 Gbps (× 2 machines: sentry + validator)',
    rpcSpecs: 'Full/RPC: same as validator / Archive (Erigon): 16c · 64 GB · 16 TB SSD',
    validatorOpp: 3,
    rpcOpp: 4,
    appOpp: 3,
    appEcosystem: 'QuickSwap, Aave (PoS), USDC bridging',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Stable',
    ovhInterest: 'Medium',
    ovhServer: 'ADVANCE-3 × 2',
    priceEst: '~€268/mo × 2 (sentry + node)',
    caveat: '⚠️ Validator = 2 machines + RabbitMQ; AggLayer migration to monitor',
    interestNote: 'Archive among largest (16 TB) — Erigon only viable option in practice',
  },
  {
    id: 'dydx',
    name: 'dYdX v4',
    color: '#6966FF',
    tier: 3,
    validators: '~60',
    hardware: '16c · 64 GB · 500 GB NVMe · high-perf stable connection',
    rpcSpecs: '16c · 64 GB · 500 GB NVMe · high-perf (same as validator)',
    validatorOpp: 3,
    rpcOpp: 3,
    appOpp: 2,
    appEcosystem: 'Perps DEX (Cosmos SDK app-chain)',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Stable',
    ovhInterest: 'Medium',
    ovhServer: 'ADVANCE-3',
    priceEst: '~€210/mo',
    interestNote: 'In-memory orderbook → no CPU/RAM spikes tolerated; sentry architecture recommended',
  },
  {
    id: 'near',
    name: 'Near Protocol',
    color: '#00C08B',
    tier: 3,
    validators: '444 (~100 full block prod. + ~344 chunk-only)',
    hardware: 'Full producer: 8c · 48 GB · 2–3 TB NVMe / Chunk-only: 8c · 16 GB · 1–2 TB NVMe',
    rpcSpecs: '8c/16t · 16–32 GB · 2.5–4 TB NVMe · high-availability',
    validatorOpp: 3,
    rpcOpp: 2,
    appOpp: 1,
    appEcosystem: 'Minimal (low TVL)',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Stable',
    ovhInterest: 'Medium',
    ovhServer: 'ADVANCE-2',
    priceEst: '~€125/mo (chunk) · ~€167/mo (full prod.)',
    caveat: '⚠️ Archive non-viable (115 TB cold storage) — non-archival only',
    interestNote: 'Stateless Validation (2024) reduced chunk-only HW needs; seat price dynamic',
  },
  {
    id: 'cosmos',
    name: 'Cosmos Hub',
    color: '#4A4F7A',
    tier: 3,
    validators: '180 active (top 180 by bonded stake)',
    hardware: '8c+/16t · 32 GB · 500 GB–2 TB NVMe · 100 Mbps+',
    rpcSpecs: 'Sentry/RPC: 4–8c · 16–32 GB · 265 GB (pruned) / 1.4 TB (archive) · 100 Mbps+',
    validatorOpp: 3,
    rpcOpp: 3,
    appOpp: 2,
    appEcosystem: 'Osmosis, Injective, Celestia, dYdX (IBC)',
    ipAccess: 'green',
    ipNote: 'Public RPC per chain',
    momentum: 'Stable',
    ovhInterest: 'Medium',
    ovhServer: 'ADVANCE-2',
    priceEst: '~€125/mo',
    interestNote: 'IBC multiplier: operators run 5–15 chains in parallel → multi-machine pipeline',
  },
  {
    id: 'cardano',
    name: 'Cardano',
    color: '#0083D1',
    tier: 3,
    validators: '~3,000 SPOs',
    hardware: '4c+ rec. · 8 GB OnDisk (post-node 10.7.0 LedgerDB V2) · 300 GB+ SSD · 10 Mbps+',
    rpcSpecs: 'Relay node: same as BP — 4c · 8 GB · 300 GB SSD',
    validatorOpp: 3,
    rpcOpp: 2,
    appOpp: 1,
    appEcosystem: 'Minimal DeFi vs ETH/BNB (low TVL)',
    ipAccess: 'green',
    ipNote: 'Public node via cardano-node',
    momentum: 'Stable',
    ovhInterest: 'Medium',
    ovhServer: 'ADVANCE-1',
    priceEst: '~€90/mo',
    interestNote: '~3,000 SPOs = volume play at low ARPU; architecture: 1 BP (private) + 2–3 relays (public)',
  },
  // ── Tier 4 — Low / Watch ──────────────────────────────────────────────
  {
    id: 'berachain',
    name: 'Berachain',
    color: '#F76540',
    tier: 4,
    validators: 'Top 69 (permissionless, min 250k BERA stake)',
    hardware: '4c (8c+ rec.) · 16 GB (32 GB+ rec.) · 1 TB SSD min → 1 TB+ NVMe prod.',
    rpcSpecs: 'Production RPC: 8c+ · 32 GB+ · 1 TB+ NVMe',
    validatorOpp: 2,
    rpcOpp: 2,
    appOpp: 3,
    appEcosystem: 'Native DeFi via Proof of Liquidity (BEX, Berps)',
    ipAccess: 'green',
    ipNote: 'Public RPC (Bera-Reth / Bera-Geth)',
    momentum: 'Rising',
    ovhInterest: 'Low',
    ovhServer: 'ADVANCE-2',
    priceEst: '~€125/mo',
    interestNote: 'Mainnet Feb 2025 — young chain, storage growing; modest hardware for now',
  },
];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function Stars({ score }: { score: number }) {
  return (
    <span className="text-yellow-400 tracking-tighter text-xs">
      {'★'.repeat(score)}
      <span className="opacity-25">{'★'.repeat(5 - score)}</span>
    </span>
  );
}

function OvhInterestBadge({ interest }: { interest: OvhInterest }) {
  const styles: Record<OvhInterest, string> = {
    'High':   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Medium': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'Low':    'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Skip':   'bg-red-500/10 text-red-400/60 border-red-500/20',
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${styles[interest]}`}>
      {interest}
    </span>
  );
}

function IpDot({ access, note }: { access: IpAccess; note: string }) {
  const colors: Record<IpAccess, string> = {
    green: 'bg-emerald-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
  };
  return (
    <span title={note} className="flex items-center gap-1.5 cursor-help">
      <span className={`w-2 h-2 rounded-full shrink-0 ${colors[access]}`} />
    </span>
  );
}

function MomentumTag({ momentum }: { momentum: Momentum }) {
  const styles: Record<Momentum, string> = {
    Rising: 'text-emerald-400',
    Stable: 'text-white/40',
    Declining: 'text-red-400/60',
  };
  const arrows: Record<Momentum, string> = { Rising: '↑', Stable: '→', Declining: '↓' };
  return (
    <span className={`text-xs font-bold ${styles[momentum]}`}>
      {arrows[momentum]} {momentum}
    </span>
  );
}

function EditableCell({ chainId, field, defaultValue }: { chainId: string; field: string; defaultValue: string }) {
  const key = `roadmap-cell-${chainId}-${field}`;
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    return localStorage.getItem(key) ?? defaultValue;
  });
  const [edited, setEdited] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(key);
  });

  function handleBlur(e: React.FocusEvent<HTMLSpanElement>) {
    const newVal = e.currentTarget.textContent ?? '';
    localStorage.setItem(key, newVal);
    setValue(newVal);
    setEdited(newVal !== defaultValue);
  }

  function handleReset() {
    localStorage.removeItem(key);
    setValue(defaultValue);
    setEdited(false);
  }

  return (
    <span className="group/cell relative inline-flex items-center gap-1">
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        className="outline-none cursor-text hover:bg-white/5 rounded px-0.5 transition-colors"
      >
        {value}
      </span>
      {edited && (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 shrink-0" title="Locally edited" />
          <button
            onClick={handleReset}
            className="opacity-0 group-hover/cell:opacity-100 text-[9px] text-white/30 hover:text-white/60 transition-all"
            title="Reset to default"
          >
            ↺
          </button>
        </>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RoadmapPage() {
  const router = useRouter();
  const accent = '#00F0FF';

  const [authReady, setAuthReady] = useState<{ mounted: boolean; loggedIn: boolean }>({ mounted: false, loggedIn: false });

  useEffect(() => {
    const loggedIn = document.cookie.includes('ovh_ui=1');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthReady({ mounted: true, loggedIn });
    if (!loggedIn) router.replace('/');
  }, [router]);

  if (!authReady.mounted || !authReady.loggedIn) return null;

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black tracking-tight text-white">
              Benchmark
            </h1>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
              style={{ color: accent, borderColor: `${accent}50`, background: `${accent}12` }}>
              Internal
            </span>
          </div>
          <p className="text-white/40 text-sm">
            OVH infrastructure opportunities across blockchain networks — validators, RPC, and app ecosystems.
          </p>
        </div>

        <RoadmapTable accent={accent} />

        {/* Intelligence Dashboard — Coming Soon modules */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <span className="w-1 h-6 rounded-full" style={{ background: accent }} />
              Intelligence Dashboard
            </h2>
            <p className="text-white/30 text-sm mt-1">
              Modules in development — hover to see status
            </p>
          </div>

          {/* Row 1: half + half */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <MarketShareTracker />
            <CommunitySentiment />
          </div>

          {/* Rows 2-3: full width */}
          <div className="flex flex-col gap-4">
            <CompetitorBenchmark />
            <StrategicHeatmap />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChainComparison table
// ---------------------------------------------------------------------------

function RoadmapTable({ accent }: { accent: string }) {
  const [expanded, setExpanded] = useState(false);

  const tiers = [1, 2, 3, 4] as const;
  const tierLabels: Record<number, string> = {
    1: 'Live — Tracked',
    2: 'High Interest',
    3: 'Medium Interest',
    4: 'Low / Watch',
  };

  const handleDownloadCSV = () => {
    const headers = ['Chain', 'Tier', 'Validators', 'Validator HW', 'OVH Server', 'ARPU est.', 'RPC / Full Node', 'Validator Opp.', 'RPC Opp.', 'App Opp.', 'App Ecosystem', 'IP Access', 'Momentum', 'OVH Interest', 'Notes'];

    const rows = CHAIN_DATA.map(chain => [
      chain.name,
      tierLabels[chain.tier],
      chain.validators,
      chain.hardware,
      chain.ovhServer,
      chain.priceEst,
      chain.rpcSpecs,
      chain.validatorOpp,
      chain.rpcOpp,
      chain.appOpp,
      chain.appEcosystem,
      chain.ipNote,
      chain.momentum,
      chain.ovhInterest,
      [chain.caveat, chain.interestNote].filter(Boolean).join(' | '),
    ].map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `benchmark-chains-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="w-1 h-6 rounded-full" style={{ background: accent }} />
            Chain Comparison
          </h2>
          <p className="text-white/30 text-xs mt-1">
            {CHAIN_DATA.length} chains · specs as of April 2026 · click any validator count to edit locally
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-[10px] font-bold text-white/50 hover:text-white"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV
        </button>
      </div>

      {/* Table wrapper with progressive blur when collapsed */}
      <div className="relative">
        <div
          className={`overflow-x-auto rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm transition-all duration-500 ${!expanded ? 'max-h-[540px] overflow-y-hidden' : ''}`}
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  'Chain',
                  'Validators',
                  'Validator Hardware',
                  'OVH Server · ARPU/mo',
                  'Full / RPC Node',
                  'Opp. V · R · A',
                  'Momentum',
                  'Interest',
                ].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers.map(tier => {
                const rows = CHAIN_DATA.filter(c => c.tier === tier);
                if (!rows.length) return null;
                return (
                  <Fragment key={tier}>
                    <tr>
                      <td colSpan={8} className="px-3 pt-5 pb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                          {tierLabels[tier]}
                        </span>
                      </td>
                    </tr>
                    {rows.map(chain => {
                      const dimmed = tier === 4 ? 'opacity-40' : tier === 3 ? 'opacity-75' : '';
                      const accentBorder = tier === 2 ? 'border-l-2' : '';
                      return (
                        <tr
                          key={chain.id}
                          className={`border-b border-white/5 hover:bg-white/3 transition-colors ${dimmed} ${accentBorder}`}
                          style={tier === 2 ? { borderLeftColor: accent } : undefined}
                        >
                          {/* Chain name */}
                          <td className="px-3 py-3 whitespace-nowrap min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: chain.color }} />
                              <div>
                                <div className="font-bold text-white">{chain.name}</div>
                                {chain.caveat && (
                                  <div className="text-[9px] text-amber-400/70 mt-0.5 max-w-[160px] leading-tight">{chain.caveat}</div>
                                )}
                              </div>
                              <IpDot access={chain.ipAccess} note={chain.ipNote} />
                            </div>
                          </td>

                          {/* Validators (editable) */}
                          <td className="px-3 py-3 text-white/60 whitespace-nowrap min-w-[120px]">
                            <EditableCell chainId={chain.id} field="validators" defaultValue={chain.validators} />
                          </td>

                          {/* Validator hardware */}
                          <td className="px-3 py-3 text-white/50 min-w-[280px] max-w-[320px]">
                            <span className="text-[10px] leading-relaxed">{chain.hardware}</span>
                          </td>

                          {/* OVH Server + ARPU */}
                          <td className="px-3 py-3 min-w-[180px]">
                            <div className="font-bold text-[10px]" style={{ color: accent }}>{chain.ovhServer}</div>
                            <div className="text-[10px] text-white/40 mt-0.5">{chain.priceEst}</div>
                          </td>

                          {/* RPC / Full node specs */}
                          <td className="px-3 py-3 text-white/40 min-w-[260px] max-w-[300px]">
                            <span className="text-[10px] leading-relaxed">{chain.rpcSpecs}</span>
                          </td>

                          {/* Opportunity scores */}
                          <td className="px-3 py-3 whitespace-nowrap min-w-[80px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] text-white/25 w-3 shrink-0">V</span>
                                <Stars score={chain.validatorOpp} />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] text-white/25 w-3 shrink-0">R</span>
                                <Stars score={chain.rpcOpp} />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] text-white/25 w-3 shrink-0">A</span>
                                <Stars score={chain.appOpp} />
                              </div>
                            </div>
                          </td>

                          {/* Momentum */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <MomentumTag momentum={chain.momentum} />
                          </td>

                          {/* OVH Interest */}
                          <td className="px-3 py-3 min-w-[120px]">
                            <div className="flex flex-col gap-1.5">
                              <OvhInterestBadge interest={chain.ovhInterest} />
                              {chain.interestNote && (
                                <span className="text-[9px] text-white/25 italic leading-snug max-w-[180px]">{chain.interestNote}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Gradient fade overlay + expand button */}
        {!expanded && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-52 rounded-b-xl bg-gradient-to-t from-[#050510] via-[#050510]/80 to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
              <button
                onClick={() => setExpanded(true)}
                className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full border font-bold text-[11px] uppercase tracking-widest transition-all duration-200 hover:scale-105"
                style={{
                  borderColor: `${accent}50`,
                  background: `rgba(0,0,0,0.7)`,
                  color: accent,
                  backdropFilter: 'blur(12px)',
                  boxShadow: `0 0 20px rgba(0,240,255,0.15)`,
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                Show all {CHAIN_DATA.length} chains
              </button>
            </div>
          </>
        )}

        {expanded && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-2 px-5 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-200 text-white/30 border-white/10 hover:border-white/20 hover:text-white/50"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              Collapse
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] text-white/20 italic">
        Specs as of April 2026 — hardware requirements evolve with each major protocol update. Click validator counts to edit locally (saved in browser).
      </p>
    </section>
  );
}

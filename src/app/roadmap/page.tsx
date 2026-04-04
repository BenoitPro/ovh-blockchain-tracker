'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BlockchainCubes from '@/components/BlockchainCubes';
import ParticlesBackground from '@/components/ParticlesBackground';
import MarketShareTracker from '@/components/benchmark/MarketShareTracker';
import CommunitySentiment from '@/components/benchmark/CommunitySentiment';
import CompetitorBenchmark from '@/components/benchmark/CompetitorBenchmark';
import StrategicHeatmap from '@/components/benchmark/StrategicHeatmap';
import HighSpendProspecting from '@/components/benchmark/HighSpendProspecting';
import RevenueProjection from '@/components/benchmark/RevenueProjection';

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
  tier: 1 | 2 | 3 | 4 | 5;
  validators: string;
  hardware: string;       // validator node specs — requirements + OVH machine
  rpcNodes: string;       // RPC node count
  rpcSpecs: string;       // RPC node specs — requirements + OVH machine
  validatorOpp: OpportunityScore;
  rpcOpp: OpportunityScore;
  appOpp: OpportunityScore;
  appEcosystem: string;
  ipAccess: IpAccess;
  ipNote: string;
  momentum: Momentum;
  ovhInterest: OvhInterest;
  interestNote?: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CHAIN_DATA: ChainRow[] = [
  {
    id: 'solana',
    name: 'Solana',
    color: '#9945FF',
    tier: 1,
    validators: '~800-900',
    hardware: '512GB RAM, 24c/48t, 2-4TB NVMe — SCALE-A2',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '*(to refine)* — likely SCALE-A1 or SCALE-A2',
    validatorOpp: 4,
    rpcOpp: 4,
    appOpp: 3,
    appEcosystem: 'Jito, Kamino, Drift, Jupiter',
    ipAccess: 'green',
    ipNote: 'Public RPC, standard IP/ASN',
    momentum: 'Rising',
    ovhInterest: 'High',
    interestNote: 'SCALE-A2 per node; Firedancer may change hw profile',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    color: '#627EEA',
    tier: 1,
    validators: '~1,070,000',
    hardware: '16GB+ RAM, 4+ cores, 2TB SSD — Advance-2 or Public Cloud',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '16-32GB RAM, 2TB+ (full) / 12TB+ (archive) — Advance-3',
    validatorOpp: 5,
    rpcOpp: 5,
    appOpp: 5,
    appEcosystem: 'Morpho, Aave, Uniswap, Lido, EigenLayer',
    ipAccess: 'green',
    ipNote: 'Public RPC, standard IP/ASN',
    momentum: 'Stable',
    ovhInterest: 'High',
    interestNote: 'Massive node count; archive RPC = high storage revenue',
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    color: '#E84142',
    tier: 2,
    validators: '~656',
    hardware: '16GB RAM, 8 cores, 1TB SSD — Advance-2',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '*(to refine)* — likely Advance-2',
    validatorOpp: 4,
    rpcOpp: 3,
    appOpp: 3,
    appEcosystem: 'Trader Joe, Benqi, GMX (C-Chain)',
    ipAccess: 'green',
    ipNote: 'Public HTTP API',
    momentum: 'Rising',
    ovhInterest: 'Medium',
    interestNote: 'Advance-2 range; subnet validators (L1s) could multiply count',
  },
  {
    id: 'sui',
    name: 'Sui',
    color: '#4DA2FF',
    tier: 2,
    validators: '~122',
    hardware: '384GB RAM, 10TB+ NVMe (validator) — SCALE-A2',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '128GB RAM, 10TB+ SSD (full node) — SCALE-A1',
    validatorOpp: 3,
    rpcOpp: 4,
    appOpp: 2,
    appEcosystem: 'Cetus, Navi (ecosystem early)',
    ipAccess: 'green',
    ipNote: 'JSON-RPC public',
    momentum: 'Rising',
    ovhInterest: 'Medium',
    interestNote: 'SCALE range per node (high ARPU) but few validators',
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    color: '#00FF87',
    tier: 3,
    validators: '~21',
    hardware: '*(to refine)* — HFT-grade, low-latency',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '*(to refine)*',
    validatorOpp: 2,
    rpcOpp: 2,
    appOpp: 4,
    appEcosystem: 'Native perps DEX (large TVL), HIP-1/HIP-2',
    ipAccess: 'yellow',
    ipNote: 'Limited public API *(to refine)*',
    momentum: 'Rising',
    ovhInterest: 'Low',
    interestNote: '21 validators only; opportunity is app layer, not infra',
  },
  {
    id: 'ton',
    name: 'TON',
    color: '#0088CC',
    tier: 3,
    validators: '~400 *(to refine)*',
    hardware: '64GB RAM, 8 cores, 1TB SSD — Advance-2 ⚠️ OVH discouraged by TON docs',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '*(to refine)*',
    validatorOpp: 3,
    rpcOpp: 2,
    appOpp: 3,
    appEcosystem: 'Telegram mini-apps, Tonstarter',
    ipAccess: 'red',
    ipNote: 'ADNL (UDP-based) — ASN detection unreliable',
    momentum: 'Rising',
    ovhInterest: 'Low',
    interestNote: 'OVH explicitly flagged for geo concentration by TON foundation',
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    color: '#E6007A',
    tier: 4,
    validators: '~297',
    hardware: '64GB RAM, 4-8 cores, 1TB NVMe — Advance-3',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '*(to refine)* — likely Advance-2',
    validatorOpp: 3,
    rpcOpp: 2,
    appOpp: 2,
    appEcosystem: 'Acala, Moonbeam, Astar',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Stable',
    ovhInterest: 'Medium',
  },
  {
    id: 'cosmos',
    name: 'Cosmos SDK (multi)',
    color: '#2E3148',
    tier: 4,
    validators: 'Varies per chain',
    hardware: '*(to refine per chain)*',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '*(to refine per chain)*',
    validatorOpp: 3,
    rpcOpp: 2,
    appOpp: 2,
    appEcosystem: 'Osmosis, dYdX, Celestia',
    ipAccess: 'green',
    ipNote: 'Public RPC per chain',
    momentum: 'Stable',
    ovhInterest: 'Medium',
    interestNote: 'Single integration covers 100+ chains via /net_info',
  },
  {
    id: 'btc-l2',
    name: 'BTC L2s',
    color: '#F7931A',
    tier: 4,
    validators: 'N/A *(to refine)*',
    hardware: '*(to refine per L2)*',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '*(to refine per L2)*',
    validatorOpp: 2,
    rpcOpp: 3,
    appOpp: 2,
    appEcosystem: 'Lightning, Stacks, Merlin *(to refine)*',
    ipAccess: 'yellow',
    ipNote: '*(to refine per L2)*',
    momentum: 'Rising',
    ovhInterest: 'Low',
    interestNote: 'Heterogeneous — no single API, unclear hw profile',
  },
  {
    id: 'aptos',
    name: 'Aptos',
    color: '#00BFA5',
    tier: 5,
    validators: '~100 *(to refine)*',
    hardware: '64GB RAM, 32 cores, 1TB SSD — SCALE-I3',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '*(to refine)*',
    validatorOpp: 2,
    rpcOpp: 2,
    appOpp: 1,
    appEcosystem: 'Minimal (low TVL, low DeFi activity)',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Declining',
    ovhInterest: 'Skip',
    interestNote: 'Declining momentum; ecosystem too thin for OVH ROI',
  },
  {
    id: 'near',
    name: 'Near',
    color: '#00C08B',
    tier: 5,
    validators: '~100 *(to refine)*',
    hardware: '32GB RAM, 8 cores, 1TB SSD — Advance-2',
    rpcNodes: '*(to refine)*',
    rpcSpecs: '*(to refine)*',
    validatorOpp: 1,
    rpcOpp: 1,
    appOpp: 1,
    appEcosystem: 'Minimal',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Declining',
    ovhInterest: 'Skip',
    interestNote: 'Declining momentum; low OVH fit',
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
      <span className="text-white/30 text-[10px] truncate max-w-[120px]">{note}</span>
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
      <BlockchainCubes opacity={0.05} />
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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RoadmapTable({ accent }: { accent: string }) {
  const tiers = [1, 2, 3, 4, 5] as const;
  const tierLabels: Record<number, string> = {
    1: 'Live',
    2: 'High Interest',
    3: 'Moderate Interest',
    4: 'Low / Watch',
    5: 'Out of Scope',
  };

  const handleDownloadCSV = () => {
    const headers = ['Chain', 'Tier', 'Validators', 'Validator Specs', 'RPC Nodes', 'RPC Specs', 'Validator Opp.', 'RPC Opp.', 'App Ecosystem Opp.', 'App Protocols', 'IP Access', 'Momentum', 'OVH Interest'];

    const rows = CHAIN_DATA.map(chain => {
      const getVal = (field: string, def: string | number) => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem(`roadmap-cell-${chain.id}-${field}`) || String(def);
        }
        return String(def);
      };

      return [
        chain.name,
        chain.tier,
        getVal('validators', chain.validators),
        getVal('hardware', chain.hardware),
        getVal('rpcNodes', chain.rpcNodes),
        getVal('rpcSpecs', chain.rpcSpecs),
        chain.validatorOpp,
        chain.rpcOpp,
        chain.appOpp,
        getVal('appEcosystem', chain.appEcosystem),
        chain.ipNote,
        chain.momentum,
        chain.ovhInterest
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `benchmark-metrics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white flex items-center gap-3">
          <span className="w-1 h-6 rounded-full" style={{ background: accent }} />
          Chain Comparison
        </h2>
        
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

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              {['Chain', 'Validators', 'Validator Specs', 'RPC Nodes', 'RPC Specs', 'Validator Opp.', 'RPC Opp.', 'App Ecosystem Opp.', 'App Protocols', 'IP Access', 'Momentum 25-26', 'OVH Interest'].map(h => (
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
                    <td colSpan={12} className="px-3 pt-4 pb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                        {tierLabels[tier]}
                      </span>
                    </td>
                  </tr>
                  {rows.map(chain => {
                    const rowOpacity = tier === 5 ? 'opacity-40' : tier === 4 ? 'opacity-60' : tier === 3 ? 'opacity-90' : '';
                    const rowBorder = tier === 2 ? 'border-l-2' : '';
                    return (
                      <tr
                        key={chain.id}
                        className={`border-b border-white/5 hover:bg-white/3 transition-colors ${rowOpacity} ${rowBorder}`}
                        style={tier === 2 ? { borderLeftColor: accent } : undefined}
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: chain.color }} />
                            <span className={`font-bold ${tier === 5 ? 'line-through text-white/30' : 'text-white'}`}>
                              {chain.name}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-3 text-white/60">
                          <EditableCell chainId={chain.id} field="validators" defaultValue={chain.validators} />
                        </td>
                        <td className="px-3 py-3 text-white/60 max-w-[180px]">
                          <EditableCell chainId={chain.id} field="hardware" defaultValue={chain.hardware} />
                        </td>
                        <td className="px-3 py-3 text-white/60">
                          <EditableCell chainId={chain.id} field="rpcNodes" defaultValue={chain.rpcNodes} />
                        </td>
                        <td className="px-3 py-3 text-white/60 max-w-[180px]">
                          <EditableCell chainId={chain.id} field="rpcSpecs" defaultValue={chain.rpcSpecs} />
                        </td>
                        <td className="px-3 py-3"><Stars score={chain.validatorOpp} /></td>
                        <td className="px-3 py-3"><Stars score={chain.rpcOpp} /></td>
                        <td className="px-3 py-3"><Stars score={chain.appOpp} /></td>
                        <td className="px-3 py-3 text-white/40 max-w-[160px] text-[10px]">
                          <EditableCell chainId={chain.id} field="appEcosystem" defaultValue={chain.appEcosystem} />
                        </td>
                        <td className="px-3 py-3"><IpDot access={chain.ipAccess} note={chain.ipNote} /></td>
                        <td className="px-3 py-3"><MomentumTag momentum={chain.momentum} /></td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <OvhInterestBadge interest={chain.ovhInterest} />
                            {chain.interestNote && (
                              <span className="text-[9px] text-white/25 italic">{chain.interestNote}</span>
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

      <p className="mt-2 text-[10px] text-white/20 italic">
        * Fields marked *(to refine)* are estimates — click any cell to edit locally (saved in your browser).
      </p>
    </section>
  );
}


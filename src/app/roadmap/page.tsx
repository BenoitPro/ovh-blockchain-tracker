'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BlockchainCubes from '@/components/BlockchainCubes';
import ParticlesBackground from '@/components/ParticlesBackground';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OpportunityScore = 1 | 2 | 3 | 4 | 5;
type IpAccess = 'green' | 'yellow' | 'red';
type Status = 'Integrated' | 'Phase 1' | 'Phase 2' | 'Optional' | 'Excluded';
type Momentum = 'Rising' | 'Stable' | 'Declining';

interface ChainRow {
  id: string;
  name: string;
  color: string;
  tier: 1 | 2 | 3 | 4 | 5;
  validators: string;
  hardware: string;
  validatorOpp: OpportunityScore;
  rpcOpp: OpportunityScore;
  appOpp: OpportunityScore;
  appEcosystem: string;
  ipAccess: IpAccess;
  ipNote: string;
  momentum: Momentum;
  status: Status;
  statusNote?: string;
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
    validators: '~1,900',
    hardware: 'Advance-4 / High-Grade (128GB RAM, NVMe)',
    validatorOpp: 4,
    rpcOpp: 4,
    appOpp: 3,
    appEcosystem: 'Jito, Kamino, Drift, Jupiter',
    ipAccess: 'green',
    ipNote: 'Public RPC, standard IP/ASN',
    momentum: 'Rising',
    status: 'Integrated',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    color: '#627EEA',
    tier: 1,
    validators: '~1,000,000',
    hardware: 'Advance-1 / Rise-3 (16GB RAM, SSD)',
    validatorOpp: 5,
    rpcOpp: 5,
    appOpp: 5,
    appEcosystem: 'Morpho, Aave, Uniswap, Lido, EigenLayer',
    ipAccess: 'green',
    ipNote: 'Public RPC, standard IP/ASN',
    momentum: 'Stable',
    status: 'Integrated',
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    color: '#E84142',
    tier: 2,
    validators: '~1,500 *(to refine)*',
    hardware: 'Advance-1 / Rise-3 (16GB RAM, 1TB NVMe)',
    validatorOpp: 4,
    rpcOpp: 3,
    appOpp: 3,
    appEcosystem: 'Trader Joe, Benqi, GMX (C-Chain)',
    ipAccess: 'green',
    ipNote: 'Public HTTP API',
    momentum: 'Rising',
    status: 'Phase 1',
    statusNote: 'C/P/X-Chain split — decide which to track',
  },
  {
    id: 'sui',
    name: 'Sui',
    color: '#4DA2FF',
    tier: 2,
    validators: '~100 *(to refine)*',
    hardware: 'Advance-2 / High-Grade (32GB RAM, 2TB NVMe)',
    validatorOpp: 3,
    rpcOpp: 4,
    appOpp: 2,
    appEcosystem: 'Cetus, Navi (ecosystem early)',
    ipAccess: 'green',
    ipNote: 'JSON-RPC public',
    momentum: 'Rising',
    status: 'Phase 1',
    statusNote: 'Permissioned validator set *(to refine)*',
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    color: '#00FF87',
    tier: 3,
    validators: '~20 *(to refine)*',
    hardware: 'HFT-grade, low-latency *(to refine)*',
    validatorOpp: 2,
    rpcOpp: 2,
    appOpp: 4,
    appEcosystem: 'Native perps DEX (large TVL), HIP-1/HIP-2',
    ipAccess: 'yellow',
    ipNote: 'Limited public API *(to refine)*',
    momentum: 'Rising',
    status: 'Phase 2',
    statusNote: 'Closed/permissioned validator set; custom L1',
  },
  {
    id: 'ton',
    name: 'TON',
    color: '#0088CC',
    tier: 3,
    validators: '~400 *(to refine)*',
    hardware: 'Advance-1 (8 cores, 16GB RAM, 1TB SSD)',
    validatorOpp: 3,
    rpcOpp: 2,
    appOpp: 3,
    appEcosystem: 'Telegram mini-apps, Tonstarter',
    ipAccess: 'red',
    ipNote: 'ADNL (UDP-based) — ASN detection unreliable',
    momentum: 'Rising',
    status: 'Phase 2',
    statusNote: 'ADNL blocks standard IP/ASN detection',
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    color: '#E6007A',
    tier: 4,
    validators: '~300 *(to refine)*',
    hardware: 'Advance-1 (8 cores, 16GB RAM)',
    validatorOpp: 3,
    rpcOpp: 2,
    appOpp: 2,
    appEcosystem: 'Acala, Moonbeam, Astar',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Stable',
    status: 'Optional',
  },
  {
    id: 'cosmos',
    name: 'Cosmos SDK (multi)',
    color: '#2E3148',
    tier: 4,
    validators: 'Varies per chain *(to refine)*',
    hardware: 'Varies per chain',
    validatorOpp: 3,
    rpcOpp: 2,
    appOpp: 2,
    appEcosystem: 'Osmosis, dYdX, Celestia',
    ipAccess: 'green',
    ipNote: 'Public RPC per chain',
    momentum: 'Stable',
    status: 'Optional',
    statusNote: 'Multi-chain SDK — generic implementation possible',
  },
  {
    id: 'btc-l2',
    name: 'BTC L2s',
    color: '#F7931A',
    tier: 4,
    validators: 'N/A *(to refine)*',
    hardware: '*(to refine per L2)*',
    validatorOpp: 2,
    rpcOpp: 3,
    appOpp: 2,
    appEcosystem: 'Lightning, Stacks, Merlin *(to refine)*',
    ipAccess: 'yellow',
    ipNote: '*(to refine per L2)*',
    momentum: 'Rising',
    status: 'Optional',
    statusNote: 'Heterogeneous — no single API',
  },
  {
    id: 'aptos',
    name: 'Aptos',
    color: '#00BFA5',
    tier: 5,
    validators: '~100 *(to refine)*',
    hardware: 'High-grade',
    validatorOpp: 2,
    rpcOpp: 2,
    appOpp: 1,
    appEcosystem: 'Minimal (low TVL, low DeFi activity)',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Declining',
    status: 'Excluded',
    statusNote: 'App ecosystem too weak; low OVH ROI',
  },
  {
    id: 'near',
    name: 'Near',
    color: '#00C08B',
    tier: 5,
    validators: '~100 *(to refine)*',
    hardware: 'Advance-1',
    validatorOpp: 1,
    rpcOpp: 1,
    appOpp: 1,
    appEcosystem: 'Minimal',
    ipAccess: 'green',
    ipNote: 'Public RPC',
    momentum: 'Declining',
    status: 'Excluded',
    statusNote: 'Declining momentum; low OVH fit',
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

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    'Integrated': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Phase 1': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'Phase 2': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Optional': 'bg-white/8 text-white/40 border-white/15',
    'Excluded': 'bg-red-500/10 text-red-400/60 border-red-500/20',
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${styles[status]}`}>
      {status}
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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loggedIn = document.cookie.includes('ovh_ui=1');
    setIsLoggedIn(loggedIn);
    setMounted(true);
    if (!loggedIn) router.replace('/');
  }, [router]);

  if (!mounted || !isLoggedIn) return null;

  return (
    <div className="relative min-h-screen">
      <BlockchainCubes opacity={0.05} network="solana" />
      <ParticlesBackground network="solana" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black tracking-tight text-white">
              Blockchain Roadmap
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
        <div className="mt-16"><RoadmapTimeline accent={accent} /></div>
        <div className="mt-16"><ChainAccordions accent={accent} /></div>
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
    1: 'Integrated',
    2: 'Phase 1 — Priority',
    3: 'Phase 2',
    4: 'Phase 3 / Optional',
    5: 'Excluded',
  };

  return (
    <section>
      <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
        <span className="w-1 h-6 rounded-full" style={{ background: accent }} />
        Chain Comparison
      </h2>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              {['Chain', 'Validators', 'Hardware', 'Validator Opp.', 'RPC Opp.', 'App Ecosystem Opp.', 'App Protocols', 'IP Access', 'Momentum 25-26', 'Status'].map(h => (
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
                    <td colSpan={10} className="px-3 pt-4 pb-1">
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
                        <td className="px-3 py-3 text-white/60 max-w-[160px]">
                          <EditableCell chainId={chain.id} field="hardware" defaultValue={chain.hardware} />
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
                            <StatusBadge status={chain.status} />
                            {chain.statusNote && (
                              <span className="text-[9px] text-white/25 italic">{chain.statusNote}</span>
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

function RoadmapTimeline({ accent }: { accent: string }) {
  return <div style={{ color: accent }}>Timeline — coming in Task 4</div>;
}
function ChainAccordions({ accent }: { accent: string }) {
  return <div style={{ color: accent }}>Accordions — coming in Task 5</div>;
}

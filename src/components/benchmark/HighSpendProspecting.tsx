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

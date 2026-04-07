'use client';

import { useState, useEffect } from 'react';

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface ProspectAPIEntry {
    name: string;
    currentProvider: string;
    stake: number;
    stakeUnit: 'SOL' | 'SUI' | 'AVAX';
}

interface ProspectsAPIResponse {
    success: boolean;
    chains: Array<{ id: string; name: string; prospects: ProspectAPIEntry[] }>;
}

interface FlatProspect {
    name: string;
    currentProvider: string;
    stake: number;
    stakeUnit: 'SOL' | 'SUI' | 'AVAX';
    chainName: string;
    priority: Priority;
}

const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  LOW:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

type Filter = 'ALL' | Priority;

export default function HighSpendProspecting() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [apiData, setApiData] = useState<ProspectsAPIResponse | null>(null);
  const [fetchError, setFetchError] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/benchmark/prospects')
      .then(r => r.json())
      .then((data: ProspectsAPIResponse) => {
        if (data.success) setApiData(data);
        else setFetchError(true);
      })
      .catch(() => setFetchError(true));
  }, []);

  // Derive flattened + ranked list
  const prospects: FlatProspect[] | null = apiData
    ? (apiData.chains ?? []).flatMap(chain =>
        chain.prospects.map((p, idx) => ({
          name: p.name,
          currentProvider: p.currentProvider,
          stake: p.stake,
          stakeUnit: p.stakeUnit,
          chainName: chain.name,
          priority: (idx < 3 ? 'HIGH' : idx < 8 ? 'MEDIUM' : 'LOW') as Priority,
        }))
      ).sort((a, b) => {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return order[a.priority] - order[b.priority];
      })
    : null;

  if (!prospects) {
    return (
      <div className="relative rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden p-5 h-48 flex items-center justify-center">
        {fetchError
          ? <span className="text-red-400/50 text-xs">Could not load prospect data.</span>
          : <span className="text-white/20 text-xs animate-pulse">Loading prospects...</span>
        }
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <div className="relative rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden p-5 h-48 flex items-center justify-center">
        <span className="text-white/20 text-xs text-center">No prospect data yet — run the Solana worker to populate.</span>
      </div>
    );
  }

  const filtered = filter === 'ALL' ? prospects : prospects.filter(v => v.priority === filter);

  const totalStake = filtered.reduce((s, v) => s + v.stake, 0);

  function fmtStake(v: FlatProspect) {
    if (v.stakeUnit === 'SOL') return `${(v.stake / 1e9).toFixed(0)} SOL`;
    if (v.stakeUnit === 'AVAX') return `${(v.stake / 1e9).toFixed(0)} AVAX`;
    // SUI stake is already stored in SUI tokens (divided by 1e9 at write time)
    return `${v.stake.toLocaleString()} ${v.stakeUnit}`;
  }

  return (
    <div className="relative rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">High-Spend Prospecting</h3>
            <p className="text-white/30 text-[10px] mt-0.5">Top global validators — OVH migration potential</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-[#00F0FF]">{filtered.length}</div>
            <div className="text-[9px] text-white/30 uppercase tracking-widest">Prospects</div>
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
              {f === 'ALL' ? `All (${prospects.length})` : `${f} (${prospects.filter(v => v.priority === f).length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30 w-6">#</th>
                <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Validator</th>
                <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Current provider</th>
                <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Chain</th>
                <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">Stake</th>
                <th className="px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest text-white/30">Priority</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, idx) => (
                <tr key={`${v.name}-${v.chainName}-${idx}`} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-3 py-2.5 text-white/20 font-mono text-[10px]">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-bold text-white/80">{v.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                      {v.currentProvider}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                      {v.chainName}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-white/60 font-mono text-[10px]">{fmtStake(v)}</td>
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
                  Total ({filtered.length} validators)
                </td>
                <td colSpan={2} />
                <td className="px-3 py-2 text-right font-black text-white/60 font-mono text-[10px]">
                  {(totalStake / 1e9).toFixed(0)} (mixed)
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

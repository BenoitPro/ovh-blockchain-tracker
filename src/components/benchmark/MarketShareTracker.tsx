'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MarketShareAPIResponse {
    success: boolean;
    chains: Array<{
        id: string; name: string; color: string;
        totalNodes: number;
        providerBreakdown: Array<{ key: string; label: string; nodeCount: number; marketShare: number; color: string }>;
        stale: boolean;
    }>;
    aggregate: {
        totalNodes: number;
        providerBreakdown: Array<{ key: string; label: string; nodeCount: number; marketShare: number; color: string }>;
    };
}

const PROVIDER_COLORS: Record<string, string> = {
  OVH:          '#00F0FF',
  Hetzner:      '#F97316',
  AWS:          '#FACC15',
  GCP:          '#3B82F6',
  'Latitude.sh':'#A78BFA',
  Vultr:        '#10B981',
  Others:       '#6B7280',
};

type ViewMode = 'aggregate' | 'per-chain';

export default function MarketShareTracker() {
  const [view, setView] = useState<ViewMode>('aggregate');
  const [apiData, setApiData] = useState<MarketShareAPIResponse | null>(null);

  useEffect(() => {
    fetch('/api/benchmark/market-share')
      .then(r => r.json())
      .then((data: MarketShareAPIResponse) => {
        if (data.success) setApiData(data);
      })
      .catch(() => {}); // silent fail — component shows loading state
  }, []);

  if (!apiData) {
    return (
      <div className="relative rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden p-5 h-48 flex items-center justify-center">
        <span className="text-white/20 text-xs animate-pulse">Loading market share data...</span>
      </div>
    );
  }

  const aggregateData = apiData.aggregate.providerBreakdown;
  const grandTotal = apiData.aggregate.totalNodes;
  const ovhEntry = apiData.aggregate.providerBreakdown.find(e => e.key === 'ovh');
  const ovhTotal = ovhEntry?.nodeCount ?? 0;
  const ovhSharePct = grandTotal > 0 ? ((ovhTotal / grandTotal) * 100).toFixed(1) : '0.0';

  // Per-chain OVH % for the breakdown table
  const perChainData = (apiData.chains ?? []).map(chain => {
    const ovhChainEntry = chain.providerBreakdown.find(e => e.key === 'ovh');
    return {
      chain: chain.name,
      color: chain.color,
      tier: 'L1' as const, // simplified — API doesn't distinguish L1/L2
      ovhPct: ovhChainEntry?.marketShare.toFixed(1) ?? '0.0',
      ovhNodes: ovhChainEntry?.nodeCount ?? 0,
      stale: chain.stale,
    };
  }).sort((a, b) => parseFloat(b.ovhPct) - parseFloat(a.ovhPct));

  return (
    <div className="relative rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">Overall Market Share</h3>
            <p className="text-white/30 text-[10px] mt-0.5">OVH vs top infra providers — top 10 blockchains (L1 + L2)</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: '#00F0FF' }}>{ovhSharePct}%</div>
            <div className="text-[9px] text-white/30 uppercase tracking-widest">OVH aggregate</div>
            <div className="text-[9px] text-white/20 mt-0.5">{ovhTotal.toLocaleString()} nodes</div>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 mb-4">
          {(['aggregate', 'per-chain'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                view === v
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                  : 'text-white/30 hover:text-white/60 border border-transparent'
              }`}
            >
              {v === 'aggregate' ? 'All chains' : 'Per chain'}
            </button>
          ))}
        </div>

        {view === 'aggregate' ? (
          <>
            {/* Horizontal bar chart — providers ranked by share */}
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={aggregateData} layout="vertical" margin={{ left: 8, right: 48, top: 0, bottom: 0 }}>
                <XAxis
                  type="number"
                  domain={[0, Math.max(...aggregateData.map(d => d.nodeCount)) * 1.1]}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category" dataKey="label"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={false} tickLine={false} width={72}
                />
                <Tooltip
                  contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                  formatter={(value: unknown) => {
                    const n = Number(value);
                    const share = ((n / grandTotal) * 100).toFixed(1);
                    return [`${n.toLocaleString()} nodes (${share}%)`, 'Total'];
                  }}
                />
                <Bar dataKey="nodeCount" radius={[0, 3, 3, 0]}>
                  {aggregateData.map(entry => (
                    <Cell key={entry.key} fill={PROVIDER_COLORS[entry.label] ?? entry.color ?? '#6B7280'} opacity={entry.key === 'ovh' ? 1 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Provider legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
              {aggregateData.map(p => (
                <span key={p.key} className="flex items-center gap-1 text-[9px] text-white/40">
                  <span className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[p.label] ?? p.color ?? '#6B7280' }} />
                  {p.label} <span className="text-white/25">{p.marketShare.toFixed(1)}%</span>
                </span>
              ))}
            </div>
          </>
        ) : (
          /* Per-chain OVH breakdown */
          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Chain</th>
                  <th className="px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest text-white/30">Type</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">OVH Nodes</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-[#00F0FF]/50">OVH Share</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30 w-28">Bar</th>
                </tr>
              </thead>
              <tbody>
                {perChainData.map(c => (
                  <tr key={c.chain} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                        <span className="text-white/70 font-medium">{c.chain}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${c.tier === 'L1' ? 'bg-[#00F0FF]/10 text-[#00F0FF]/60' : 'bg-purple-500/10 text-purple-400/60'}`}>
                        {c.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-white/50 font-mono">{c.ovhNodes}</td>
                    <td className="px-3 py-2.5 text-right font-black text-[#00F0FF]">{c.ovhPct}%</td>
                    <td className="px-3 py-2.5">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-24">
                        <div className="h-full rounded-full bg-[#00F0FF]" style={{ width: `${Math.min(parseFloat(c.ovhPct) * 4, 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

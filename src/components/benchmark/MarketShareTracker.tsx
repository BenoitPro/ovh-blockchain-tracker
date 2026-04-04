'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ComingSoonCard } from './ComingSoonCard';

// Top 10 blockchains (L1 + L2) — estimated node counts per provider
// Source: simulated data based on ASN detection methodology
const CHAINS_DATA = [
  { chain: 'Ethereum',  tier: 'L1', color: '#627EEA', OVH: 8240,  Hetzner: 12380, AWS: 15610, GCP: 5180,  'Latitude.sh': 2100, Vultr: 890,  Others: 24600 },
  { chain: 'Solana',    tier: 'L1', color: '#9945FF', OVH: 147,   Hetzner: 213,   AWS: 189,   GCP: 64,    'Latitude.sh': 89,   Vultr: 34,   Others: 264   },
  { chain: 'Polygon',   tier: 'L2', color: '#8247E5', OVH: 94,    Hetzner: 138,   AWS: 172,   GCP: 58,    'Latitude.sh': 41,   Vultr: 18,   Others: 279   },
  { chain: 'Arbitrum',  tier: 'L2', color: '#28A0F0', OVH: 61,    Hetzner: 89,    AWS: 118,   GCP: 34,    'Latitude.sh': 27,   Vultr: 12,   Others: 159   },
  { chain: 'Avalanche', tier: 'L1', color: '#E84142', OVH: 89,    Hetzner: 134,   AWS: 98,    GCP: 31,    'Latitude.sh': 45,   Vultr: 19,   Others: 240   },
  { chain: 'Polkadot',  tier: 'L1', color: '#E6007A', OVH: 84,    Hetzner: 128,   AWS: 102,   GCP: 38,    'Latitude.sh': 31,   Vultr: 14,   Others: 300   },
  { chain: 'Cosmos',    tier: 'L1', color: '#2E3148', OVH: 118,   Hetzner: 174,   AWS: 138,   GCP: 48,    'Latitude.sh': 56,   Vultr: 24,   Others: 442   },
  { chain: 'Optimism',  tier: 'L2', color: '#FF0420', OVH: 48,    Hetzner: 72,    AWS: 94,    GCP: 28,    'Latitude.sh': 21,   Vultr: 9,    Others: 128   },
  { chain: 'Base',      tier: 'L2', color: '#0052FF', OVH: 32,    Hetzner: 51,    AWS: 68,    GCP: 19,    'Latitude.sh': 15,   Vultr: 7,    Others: 108   },
  { chain: 'Sui',       tier: 'L1', color: '#4DA2FF', OVH: 18,    Hetzner: 27,    AWS: 22,    GCP: 9,     'Latitude.sh': 8,    Vultr: 3,    Others: 35    },
];

const PROVIDERS = ['OVH', 'Hetzner', 'AWS', 'GCP', 'Latitude.sh', 'Vultr', 'Others'] as const;
type Provider = typeof PROVIDERS[number];

const PROVIDER_COLORS: Record<Provider, string> = {
  OVH:          '#00F0FF',
  Hetzner:      '#F97316',
  AWS:          '#FACC15',
  GCP:          '#3B82F6',
  'Latitude.sh':'#A78BFA',
  Vultr:        '#10B981',
  Others:       '#6B7280',
};

// Compute aggregated totals across all chains
function computeTotals() {
  const totals: Record<Provider, number> = { OVH: 0, Hetzner: 0, AWS: 0, GCP: 0, 'Latitude.sh': 0, Vultr: 0, Others: 0 };
  for (const chain of CHAINS_DATA) {
    for (const p of PROVIDERS) {
      totals[p] += chain[p] ?? 0;
    }
  }
  return totals;
}

type ViewMode = 'aggregate' | 'per-chain';

export default function MarketShareTracker() {
  const [view, setView] = useState<ViewMode>('aggregate');

  const totals = computeTotals();
  const grandTotal = Object.values(totals).reduce((s, n) => s + n, 0);
  const ovhTotal = totals['OVH'];
  const ovhSharePct = ((ovhTotal / grandTotal) * 100).toFixed(1);

  // Aggregate bar data (sorted by total desc)
  const aggregateData = PROVIDERS.map(p => ({
    name: p,
    nodes: totals[p],
    share: ((totals[p] / grandTotal) * 100).toFixed(1),
  })).sort((a, b) => b.nodes - a.nodes);

  // Per-chain OVH % for the breakdown table
  const perChainData = CHAINS_DATA.map(c => {
    const chainTotal = PROVIDERS.reduce((s, p) => s + (c[p] ?? 0), 0);
    return {
      chain: c.chain,
      color: c.color,
      tier: c.tier,
      ovhPct: ((c.OVH / chainTotal) * 100).toFixed(1),
      ovhNodes: c.OVH,
    };
  }).sort((a, b) => parseFloat(b.ovhPct) - parseFloat(a.ovhPct));

  return (
    <ComingSoonCard
      title="Overall Market Share Tracker"
      description="OVH aggregate share vs top providers across 10 major blockchains"
    >
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
                  domain={[0, Math.max(...aggregateData.map(d => d.nodes)) * 1.1]}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category" dataKey="name"
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
                <Bar dataKey="nodes" radius={[0, 3, 3, 0]}>
                  {aggregateData.map(entry => (
                    <Cell key={entry.name} fill={PROVIDER_COLORS[entry.name as Provider]} opacity={entry.name === 'OVH' ? 1 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Provider legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
              {aggregateData.map(p => (
                <span key={p.name} className="flex items-center gap-1 text-[9px] text-white/40">
                  <span className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[p.name as Provider] }} />
                  {p.name} <span className="text-white/25">{p.share}%</span>
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

        <p className="text-[9px] text-white/20 mt-3 italic">* Simulated data — ASN-based detection across top 10 chains by market cap</p>
      </div>
    </ComingSoonCard>
  );
}

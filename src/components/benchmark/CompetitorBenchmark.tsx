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

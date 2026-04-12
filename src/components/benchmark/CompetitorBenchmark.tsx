'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { normalizeProviders } from '@/lib/benchmark/normalizeProviders';
import type { ProviderBreakdownEntry } from '@/types/dashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChainEntry {
  id: string;
  name: string;
  color: string;
  totalNodes: number;
  providerBreakdown: ProviderBreakdownEntry[];
  stale: boolean;
}

interface MarketShareData {
  chains: ChainEntry[];
  aggregate: {
    totalNodes: number;
    providerBreakdown: ProviderBreakdownEntry[];
  };
}

interface EvolutionPoint {
  month: string;
  [provider: string]: number | string;
}

interface EvolutionData {
  monthly: EvolutionPoint[];
  providers: string[];
  weeklyDelta: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function deltaLabel(delta: number | undefined): { text: string; cls: string } {
  if (delta === undefined || delta === null) return { text: '—', cls: 'text-white/30' };
  if (delta > 0) return { text: `↑ +${delta}`, cls: 'text-emerald-400' };
  if (delta < 0) return { text: `↓ ${delta}`, cls: 'text-red-400' };
  return { text: '→ 0', cls: 'text-white/30' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompetitorBenchmark() {
  const [activeChain, setActiveChain] = useState<string>('all');
  const [marketData, setMarketData] = useState<MarketShareData | null>(null);
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingEvolution, setLoadingEvolution] = useState(true);

  // Fetch market-share data (current snapshot)
  useEffect(() => {
    const load = async () => {
      setLoadingMarket(true);
      try {
        const r = await fetch('/api/benchmark/market-share');
        const json = await r.json() as { success: boolean } & MarketShareData;
        if (json.success) setMarketData(json);
      } catch {
        /* silently degrade */
      } finally {
        setLoadingMarket(false);
      }
    };
    void load();
  }, []);

  // Fetch evolution data whenever activeChain changes
  useEffect(() => {
    const load = async () => {
      setLoadingEvolution(true);
      const param = activeChain === 'all' ? '' : `?chain=${activeChain}`;
      try {
        const r = await fetch(`/api/benchmark/evolution${param}`);
        const json = await r.json() as { success: boolean } & EvolutionData;
        if (json.success) setEvolutionData(json);
      } catch {
        /* silently degrade */
      } finally {
        setLoadingEvolution(false);
      }
    };
    void load();
  }, [activeChain]);

  // Derive display data from marketData
  const chains: ChainEntry[] = marketData?.chains ?? [];
  const chainTabs = [{ id: 'all', name: 'All', color: '#FFFFFF' }, ...chains.map(c => ({ id: c.id, name: c.name, color: c.color }))];

  const activeBreakdown: ProviderBreakdownEntry[] =
    activeChain === 'all'
      ? (marketData?.aggregate.providerBreakdown ?? [])
      : (chains.find(c => c.id === activeChain)?.providerBreakdown ?? []);

  const normalizedProviders = normalizeProviders(activeBreakdown, 6);

  // Bar chart data — one bar per chain (or one bar for the active chain)
  const barRows = activeChain === 'all' ? chains : chains.filter(c => c.id === activeChain);
  const barData = barRows.map(chain => {
    const normalized = normalizeProviders(chain.providerBreakdown, 6);
    const point: Record<string, number | string> = { name: chain.name };
    for (const p of normalized) {
      point[p.label] = p.nodeCount;
    }
    return point;
  });

  // All provider labels visible in bar chart
  const barProviderLabels = Array.from(
    new Set(normalizedProviders.map(p => p.label))
  );

  // Provider color map (from normalizedProviders)
  const providerColorMap: Record<string, string> = {};
  for (const p of normalizedProviders) {
    providerColorMap[p.label] = p.color;
  }

  // Table rows
  const tableRows = activeChain === 'all' ? chains : chains.filter(c => c.id === activeChain);

  // Weekly delta per chain (from evolution API)
  const weeklyDelta = evolutionData?.weeklyDelta ?? {};

  // Evolution chart
  const evolutionMonthly = evolutionData?.monthly ?? [];
  const evolutionProviders = evolutionData?.providers ?? [];
  const hasEvolutionData = evolutionMonthly.length > 0;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-white">Competitor Benchmark</h3>
          <p className="text-white/30 text-[10px] mt-0.5">Nodes detected by provider via ASN (MaxMind)</p>
        </div>
        {marketData && chains.some(c => c.stale) && (
          <span className="text-[9px] text-amber-400/70 font-medium">Partial stale data</span>
        )}
      </div>

      {/* Chain tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {chainTabs.map(chain => (
          <button
            key={chain.id}
            onClick={() => setActiveChain(chain.id)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
              activeChain === chain.id
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                : 'text-white/30 hover:text-white/60 border border-transparent'
            }`}
          >
            {chain.name}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loadingMarket && (
        <div className="text-center py-12 text-white/20 text-xs">Loading provider data…</div>
      )}

      {!loadingMarket && (
        <>
          {/* Grouped bar chart */}
          <div className="mb-6">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-2">Current distribution</p>
            {barData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-white/20 text-xs">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    // @ts-expect-error recharts formatter type
                    formatter={(value: unknown, name: string) => [fmt(Number(value ?? 0)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                  {barProviderLabels.map(label => (
                    <Bar
                      key={label}
                      dataKey={label}
                      fill={providerColorMap[label] ?? '#6B7280'}
                      opacity={label === 'OVHcloud' ? 1 : 0.65}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Evolution area chart */}
          <div className="mb-6">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-2">6-month evolution</p>
            {loadingEvolution ? (
              <div className="flex items-center justify-center h-[160px] text-white/20 text-xs">Loading…</div>
            ) : !hasEvolutionData ? (
              <div className="flex items-center justify-center h-[160px] text-white/20 text-xs text-center px-4">
                Historical data will appear here as snapshots accumulate
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={evolutionMonthly} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                  <defs>
                    {evolutionProviders.map((label, i) => (
                      <linearGradient key={label} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={providerColorMap[label] ?? '#6B7280'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={providerColorMap[label] ?? '#6B7280'} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    // @ts-expect-error recharts formatter type
                    formatter={(value: unknown, name: string) => [fmt(Number(value ?? 0)), name]}
                  />
                  {evolutionProviders.map((label, i) => (
                    <Area
                      key={label}
                      type="monotone"
                      dataKey={label}
                      stroke={providerColorMap[label] ?? '#6B7280'}
                      strokeWidth={label === 'OVHcloud' ? 2 : 1.5}
                      fill={`url(#grad-${i})`}
                      opacity={label === 'OVHcloud' ? 1 : 0.7}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Data table */}
          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Chain</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-[#00F0FF]/70">OVHcloud</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">Total nodes</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">OVH %</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">Δ OVH /7d</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(row => {
                  const ovhEntry = row.providerBreakdown.find(
                    e => e.key === 'ovh' || e.label === 'OVHcloud',
                  );
                  const delta = weeklyDelta[row.id];
                  const { text: deltaText, cls: deltaCls } = deltaLabel(delta);
                  return (
                    <tr key={row.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                          <span className="text-white/70 font-medium">{row.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[#00F0FF]">
                        {fmt(ovhEntry?.nodeCount ?? 0)}
                      </td>
                      <td className="px-3 py-2 text-right text-white/50">
                        {fmt(row.totalNodes)}
                      </td>
                      <td className="px-3 py-2 text-right text-white/50">
                        {ovhEntry ? `${ovhEntry.marketShare.toFixed(1)}%` : '—'}
                      </td>
                      <td className={`px-3 py-2 text-right text-[10px] font-bold ${deltaCls}`}>
                        {deltaText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

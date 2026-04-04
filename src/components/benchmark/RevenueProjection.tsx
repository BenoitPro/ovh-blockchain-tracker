'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { ComingSoonCard } from './ComingSoonCard';

const CHAIN_BREAKDOWN = [
  { chain: 'Solana',    color: '#9945FF', nodes: 147,  serverRef: 'SCALE-A2',  pricePerMonth: 500,  included: true },
  { chain: 'Ethereum',  color: '#627EEA', nodes: 8240, serverRef: 'Advance-2', pricePerMonth: 150,  included: true },
  { chain: 'Avalanche', color: '#E84142', nodes: 89,   serverRef: 'Advance-2', pricePerMonth: 150,  included: true },
  { chain: 'Sui',       color: '#4DA2FF', nodes: 18,   serverRef: 'SCALE-A2',  pricePerMonth: 500,  included: true },
  { chain: 'Hyperliquid', color: '#00FF87', nodes: 3,  serverRef: 'HFT-grade', pricePerMonth: 800,  included: false },
  { chain: 'TON',       color: '#0088CC', nodes: 0,    serverRef: 'Advance-2', pricePerMonth: 150,  included: false },
];

const MONTHS = ['Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];

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
    const marketMultiplier = 1 + (marketGrowthPct / 100) * t;
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
            <span className="flex items-center gap-1.5 text-[9px] text-white/30"><span className="w-4 h-0.5 bg-[#00F0FF] inline-block opacity-60" />Projection scénario</span>
            <span className="flex items-center gap-1.5 text-[9px] text-white/30"><span className="w-4 h-0.5 bg-gray-500 inline-block opacity-60" />Croissance marché seule</span>
          </div>
        </div>

        <p className="text-[9px] text-white/20 italic">* Données simulées. Estimation conservative excluant RPC, storage et app nodes.</p>
      </div>
    </ComingSoonCard>
  );
}

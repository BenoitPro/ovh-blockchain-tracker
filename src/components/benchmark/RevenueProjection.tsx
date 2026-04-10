'use client';

import { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { ComingSoonCard } from './ComingSoonCard';

// ─── Chain config ─────────────────────────────────────────────────────────────

interface LiveChainConfig {
  id: string;
  label: string;
  color: string;
  apiPath: string;
  nodeField: string;          // key to read from API data
  server: string;
  priceEur: number;
  confidence: number;         // 0–100
  confidenceReason: string;   // shown in tooltip
}

interface ComingSoonChainConfig {
  label: string;
  color: string;
  server: string;
  priceEur: number;
}

const LIVE_CHAINS: LiveChainConfig[] = [
  {
    id: 'solana', label: 'Solana', color: '#9945FF',
    apiPath: '/api/solana', nodeField: 'ovhNodes',
    server: 'SCALE-A2', priceEur: 390, confidence: 85,
    confidenceReason: 'IPs publiques + RPC direct. Limite : RPC nodes non comptés.',
  },
  {
    id: 'ethereum', label: 'Ethereum', color: '#627EEA',
    apiPath: '/api/ethereum', nodeField: 'ovhNodes',
    server: 'ADVANCE-2', priceEur: 125, confidence: 60,
    confidenceReason: 'Crawl Migalabs (~50% coverage). Tous les validators ne publient pas leur IP.',
  },
  {
    id: 'avalanche', label: 'Avalanche', color: '#E84142',
    apiPath: '/api/avalanche', nodeField: 'ovhNodes',
    server: 'ADVANCE-2', priceEur: 125, confidence: 70,
    confidenceReason: 'Peer discovery via RPC. Quelques nodes derrière NAT non détectables.',
  },
  {
    id: 'sui', label: 'Sui', color: '#4DA2FF',
    apiPath: '/api/sui', nodeField: 'ovhNodes',
    server: 'SCALE-A2', priceEur: 390, confidence: 85,
    confidenceReason: 'RPC direct, tous les validators ont une IP publique.',
  },
  {
    id: 'tron', label: 'Tron', color: '#FF060A',
    apiPath: '/api/tron', nodeField: 'ovhNodes',
    server: 'ADVANCE-3', priceEur: 212, confidence: 50,
    confidenceReason: 'Peer discovery sur >8 000 nodes. Coverage partielle, beaucoup de nodes non publics.',
  },
  {
    id: 'hyperliquid', label: 'Hyperliquid', color: '#00E5BE',
    apiPath: '/api/hyperliquid', nodeField: 'ovhValidators',
    server: 'SCALE-A1', priceEur: 370, confidence: 30,
    confidenceReason: "Name-matching uniquement (pas d'IP geolocation). Très faible fiabilité.",
  },
];

const COMING_SOON_CHAINS: ComingSoonChainConfig[] = [
  { label: 'Polkadot',   color: '#E6007A', server: 'ADVANCE-2', priceEur: 125 },
  { label: 'Aptos',      color: '#2DD8A3', server: 'SCALE-A2',  priceEur: 390 },
  { label: 'Celestia',   color: '#7B2FBE', server: 'SCALE-A3',  priceEur: 450 },
  { label: 'Near',       color: '#00C08B', server: 'ADVANCE-2', priceEur: 125 },
  { label: 'Cosmos Hub', color: '#5C6BC0', server: 'ADVANCE-2', priceEur: 125 },
  { label: 'BNB Chain',  color: '#F0B90B', server: 'SCALE-A1',  priceEur: 370 },
  { label: 'Cardano',    color: '#0033AD', server: 'ADVANCE-1', priceEur: 90  },
];

// ─── Historical data ──────────────────────────────────────────────────────────

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const HISTORICAL = [
  { month: "Oct'25", mrr: 1089 },
  { month: "Nov'25", mrr: 1148 },
  { month: "Dec'25", mrr: 1198 },
  { month: "Jan'26", mrr: 1242 },
  { month: "Feb'26", mrr: 1288 },
  { month: "Mar'26", mrr: 1332 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `€${(n / 1_000).toFixed(0)}k`;
  return `€${Math.round(n)}`;
}

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

function ConfidenceBadge({ score, reason }: { score: number; reason: string }) {
  const color =
    score >= 80 ? 'text-emerald-400' :
    score >= 60 ? 'text-yellow-400'  :
    score >= 40 ? 'text-orange-400'  :
                  'text-red-400';
  const dot =
    score >= 80 ? 'bg-emerald-400' :
    score >= 60 ? 'bg-yellow-400'  :
    score >= 40 ? 'bg-orange-400'  :
                  'bg-red-400';

  return (
    <span className="relative group inline-flex items-center gap-1 cursor-help">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className={`text-[9px] font-bold ${color}`}>{score}%</span>
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 z-10
                       hidden group-hover:block
                       text-[9px] text-white/70 leading-relaxed
                       bg-[#0a0a0f] border border-white/10 rounded-lg px-2.5 py-2
                       pointer-events-none">
        {reason}
      </span>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RevenueProjection() {
  const [targetShare, setTargetShare] = useState(25);
  const [marketGrowth, setMarketGrowth] = useState(18);
  const [assumptionsOpen, setAssumptionsOpen] = useState(true);

  // Live data state
  const [nodeCounts, setNodeCounts] = useState<Record<string, number | null>>({});
  const [fetchError, setFetchError] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const results = await Promise.allSettled(
        LIVE_CHAINS.map(async (chain) => {
          const res = await fetch(chain.apiPath);
          if (!res.ok) throw new Error(`${chain.id} fetch failed`);
          const json = await res.json();
          if (!json.success || !json.data) throw new Error(`${chain.id} no data`);
          const count = json.data[chain.nodeField] as number ?? 0;
          return { id: chain.id, count };
        })
      );

      const counts: Record<string, number | null> = {};
      const errors: Record<string, boolean> = {};

      results.forEach((result, i) => {
        const id = LIVE_CHAINS[i].id;
        if (result.status === 'fulfilled') {
          counts[id] = result.value.count;
        } else {
          counts[id] = null;
          errors[id] = true;
        }
      });

      setNodeCounts(counts);
      setFetchError(errors);
      setLoading(false);
    }

    fetchAll();
  }, []);

  // Revenue calculations
  const currentMrr = LIVE_CHAINS.reduce((sum, c) => {
    const count = nodeCounts[c.id] ?? 0;
    return sum + count * c.priceEur;
  }, 0);
  const currentArr = currentMrr * 12;
  const currentSharePct = 16.2;

  // Weighted confidence (weighted by ARR contribution)
  const totalDetectedArr = currentArr;
  const weightedConfidenceRaw = LIVE_CHAINS.reduce((sum, c) => {
    const count = nodeCounts[c.id] ?? 0;
    const arr = count * c.priceEur * 12;
    return sum + arr * (c.confidence / 100);
  }, 0);
  const weightedConfidence = totalDetectedArr > 0
    ? Math.round(weightedConfidenceRaw / totalDetectedArr)
    : 0;

  const arrLow  = Math.round(totalDetectedArr * 0.70);
  const arrHigh = Math.round(totalDetectedArr * 1.45);
  const coveredCount = LIVE_CHAINS.length;
  const totalChainCount = LIVE_CHAINS.length + COMING_SOON_CHAINS.length;

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
    { month: "Mar'26*", actual: Math.round(currentMrr / 1000), projected: Math.round(currentMrr / 1000), baseline: Math.round(currentMrr / 1000) },
    ...projectionData.map(p => ({ month: p.month, actual: null as number | null, projected: Math.round(p.projected / 1000), baseline: Math.round(p.baseline / 1000) })),
  ];

  return (
    <ComingSoonCard
      title="Revenue Projection"
      description="Revenue impact simulator based on market share growth"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-black text-white">Revenue Projection</h3>
            <p className="text-white/30 text-[10px] mt-0.5">Estimation conservative — validator nodes uniquement (hors RPC, storage, app)</p>
          </div>
        </div>

        {/* Block A: Assumptions */}
        <div className="mb-5 rounded-xl border border-white/5 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors"
            onClick={() => setAssumptionsOpen(!assumptionsOpen)}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Assumptions & methodology</span>
            <span className="text-white/20 text-xs">{assumptionsOpen ? '▲' : '▼'}</span>
          </button>
          {assumptionsOpen && (
            <div className="px-4 pb-4 border-t border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2">Chains intégrées</p>
                  <div className="flex flex-col gap-1.5">
                    {LIVE_CHAINS.map(c => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-[10px] text-white/60 w-20">{c.label}</span>
                        <span className="text-[9px] font-bold text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{c.server}</span>
                        <span className="text-[9px] text-white/40 ml-auto">€{c.priceEur}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2">Methodology</p>
                  <ul className="flex flex-col gap-1.5">
                    <li className="text-[10px] text-white/40 leading-relaxed">• OVH nodes détectés via MaxMind ASN × prix serveur de référence par chain</li>
                    <li className="text-[10px] text-white/40 leading-relaxed">• Serveur de référence = machine OVH recommandée pour ce type de node</li>
                    <li className="text-[10px] text-white/40 leading-relaxed">• Hors : RPC nodes, stockage additionnel, app nodes, setups multi-serveurs</li>
                    <li className="text-[10px] text-white/40 leading-relaxed">• Prix officiels OVH en EUR (pricelist avril 2026)</li>
                    <li className="text-[10px] text-white/40 leading-relaxed">• Part de marché OVH actuelle : 16.2% (estimation Solana)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Block B: Chain breakdown table */}
        <div className="mb-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-3">
            Revenu estimé par chain
          </p>
          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-3 py-2 text-left   text-[9px] font-black uppercase tracking-widest text-white/30">Chain</th>
                  <th className="px-3 py-2 text-right  text-[9px] font-black uppercase tracking-widest text-white/30">OVH nodes</th>
                  <th className="px-3 py-2 text-left   text-[9px] font-black uppercase tracking-widest text-white/30">Serveur réf.</th>
                  <th className="px-3 py-2 text-right  text-[9px] font-black uppercase tracking-widest text-white/30">MRR est.</th>
                  <th className="px-3 py-2 text-right  text-[9px] font-black uppercase tracking-widest text-white/30">ARR est.</th>
                  <th className="px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest text-white/30">Confiance</th>
                </tr>
              </thead>
              <tbody>
                {/* Live chains */}
                {LIVE_CHAINS.map((c) => {
                  const count = nodeCounts[c.id];
                  const hasError = fetchError[c.id];
                  const mrr = (count ?? 0) * c.priceEur;

                  return (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                          <span className="text-white/70 font-medium">{c.label}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {loading ? (
                          <span className="inline-block w-8 h-3 rounded bg-white/10 animate-pulse" />
                        ) : hasError ? (
                          <span className="text-orange-400/60 text-[9px]">⚠ indispo</span>
                        ) : (
                          <span className="text-white/50">{(count ?? 0).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[9px] font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                          {c.server}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {loading ? (
                          <span className="inline-block w-12 h-3 rounded bg-white/10 animate-pulse" />
                        ) : hasError ? (
                          <span className="text-white/20">—</span>
                        ) : (
                          <span className="text-white/60">{fmtEur(mrr)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {loading ? (
                          <span className="inline-block w-14 h-3 rounded bg-white/10 animate-pulse" />
                        ) : hasError ? (
                          <span className="text-white/20">—</span>
                        ) : (
                          <span className="text-white/50">{fmtEur(mrr * 12)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <ConfidenceBadge score={c.confidence} reason={c.confidenceReason} />
                      </td>
                    </tr>
                  );
                })}

                {/* Coming soon chains */}
                {COMING_SOON_CHAINS.map((c) => (
                  <tr key={c.label} className="border-b border-white/5 opacity-35">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                        <span className="text-white/50 font-medium">{c.label}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-white/20">—</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] font-bold text-white/25 bg-white/5 px-1.5 py-0.5 rounded">
                        {c.server}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-white/20">—</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-white/20">—</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-[8px] text-white/25 italic border border-white/10 px-1.5 py-0.5 rounded">
                        soon
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Total row */}
                <tr className="border-t border-white/10 bg-white/2">
                  <td colSpan={3} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/30">
                    Total détecté ({LIVE_CHAINS.length} chains)
                  </td>
                  <td className="px-3 py-2 text-right font-black text-[#00F0FF]">
                    {loading ? <span className="inline-block w-14 h-3 rounded bg-white/10 animate-pulse" /> : `${fmtEur(currentMrr)}/mo`}
                  </td>
                  <td className="px-3 py-2 text-right font-black text-[#00F0FF]">
                    {loading ? <span className="inline-block w-16 h-3 rounded bg-white/10 animate-pulse" /> : `${fmtEur(currentArr)}/an`}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[9px] text-white/20 mt-1.5 italic">
            ↓ estimation conservative — hors RPC nodes, storage nodes, multi-server setups
          </p>
        </div>

        {/* Block C: Global aggregate */}
        {!loading && totalDetectedArr > 0 && (
          <div className="mb-5 rounded-xl border border-white/8 bg-white/2 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-3">
              Revenu global estimé — {coveredCount} / {totalChainCount} chains intégrées
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl p-3 border border-[#00F0FF]/20 bg-[#00F0FF]/5">
                <div className="text-lg font-black text-[#00F0FF]">{fmtEur(totalDetectedArr)}</div>
                <div className="text-[9px] text-white/30 mt-0.5">ARR détecté / an</div>
              </div>

              <div className="rounded-xl p-3 border border-white/5">
                <div className="text-lg font-black text-white">
                  {fmtEur(arrLow)} – {fmtEur(arrHigh)}
                </div>
                <div className="text-[9px] text-white/30 mt-0.5">Fourchette réaliste</div>
              </div>

              <div className="rounded-xl p-3 border border-white/5 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-black text-white">{weightedConfidence}%</div>
                  {/* Dot bar */}
                  <div className="flex gap-0.5">
                    {[20, 40, 60, 80, 100].map((threshold) => (
                      <span
                        key={threshold}
                        className={`w-2 h-2 rounded-full ${
                          weightedConfidence >= threshold ? 'bg-[#00F0FF]' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[9px] text-white/30 mt-0.5">Confiance pondérée</div>
              </div>
            </div>

            {/* Uncertainty sources */}
            <details className="group">
              <summary className="text-[9px] font-black uppercase tracking-widest text-white/25 cursor-pointer hover:text-white/40 transition-colors list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                Sources d&apos;incertitude
              </summary>
              <ul className="mt-2 flex flex-col gap-1.5 pl-3">
                {[
                  'Couverture ASN partielle — MaxMind ne détecte pas 100% des IPs OVH (sous-réseaux non enregistrés, reverse proxy)',
                  'Hypothèse serveur de référence — certains nodes OVH utilisent un tier différent (±20%)',
                  'Nodes non comptés — RPC nodes, storage nodes non inclus → sous-estimation probable',
                  `${COMING_SOON_CHAINS.length} chains non intégrées (~45% du marché adressable estimé)`,
                  'Hyperliquid — name-matching uniquement, chiffre très approximatif',
                ].map((s) => (
                  <li key={s} className="text-[9px] text-white/35 leading-relaxed">• {s}</li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {/* Block D: Simulator */}
        <div className="mb-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-4">Simulateur 12 mois</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-white/50">Target OVH market share</label>
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
              { label: 'MRR actuel', value: fmtEur(currentMrr), sub: '/mois' },
              { label: 'ARR actuel', value: fmtEur(currentArr), sub: '/an' },
              { label: 'MRR projeté (12m)', value: fmtEur(projectedMrr), sub: `+${fmtEur(deltaMrr)}`, highlight: true },
              { label: 'ARR projeté (12m)', value: fmtEur(projectedArr), sub: `+${deltaArrPct}% ↑`, highlight: true },
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
              <YAxis tickFormatter={v => `€${v}k`} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                // @ts-expect-error recharts formatter type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: string) => value ? [`€${value}k/mo`, name === 'actual' ? 'Historique' : name === 'projected' ? 'Scénario projection' : 'Croissance marché seule'] : ['-']}
              />
              <ReferenceLine x="Mar'26*" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" label={{ value: 'Now', fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
              <Area type="monotone" dataKey="actual" stroke="#00F0FF" strokeWidth={2} fill="url(#gradActual)" connectNulls={false} dot={false} />
              <Area type="monotone" dataKey="baseline" stroke="#6B7280" strokeWidth={1} strokeDasharray="4 4" fill="url(#gradBaseline)" connectNulls={false} dot={false} />
              <Area type="monotone" dataKey="projected" stroke="#00F0FF" strokeWidth={2} strokeDasharray="6 3" fill="url(#gradProjected)" connectNulls={false} dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[9px] text-white/30"><span className="w-4 h-0.5 bg-[#00F0FF] inline-block" />Historique</span>
            <span className="flex items-center gap-1.5 text-[9px] text-white/30"><span className="w-4 h-0.5 bg-[#00F0FF] inline-block opacity-60" />Scénario projection</span>
            <span className="flex items-center gap-1.5 text-[9px] text-white/30"><span className="w-4 h-0.5 bg-gray-500 inline-block opacity-60" />Croissance marché seule</span>
          </div>
        </div>

        <p className="text-[9px] text-white/20 italic">* Données simulées. Estimation conservative hors RPC, storage et app nodes. Prix officiels OVH EUR — avril 2026.</p>
      </div>
    </ComingSoonCard>
  );
}

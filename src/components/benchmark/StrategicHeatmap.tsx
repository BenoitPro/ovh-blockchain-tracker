'use client';

import { ComingSoonCard } from './ComingSoonCard';

interface ChainRow {
  chain: string;
  color: string;
  validator: number;
  rpc: number;
  app: number;
  hwFit: string;
  ipAccess: 'green' | 'yellow' | 'red';
  ovhScore: number;
  tooltip: string;
}

const ROWS: ChainRow[] = [
  { chain: 'Solana',      color: '#9945FF', validator: 4, rpc: 4, app: 3, hwFit: 'SCALE-A2',  ipAccess: 'green',  ovhScore: 4.2, tooltip: 'Fort potentiel validateurs + RPC. Firedancer peut modifier le profil HW.' },
  { chain: 'Ethereum',    color: '#627EEA', validator: 5, rpc: 5, app: 5, hwFit: 'Advance-2', ipAccess: 'green',  ovhScore: 5.0, tooltip: 'Priorité maximale. 1M+ validateurs, archive RPC = fort revenu storage.' },
  { chain: 'Avalanche',   color: '#E84142', validator: 4, rpc: 3, app: 3, hwFit: 'Advance-2', ipAccess: 'green',  ovhScore: 3.5, tooltip: 'Bonne opportunité validateurs. Subnets peuvent multiplier le count.' },
  { chain: 'Sui',         color: '#4DA2FF', validator: 3, rpc: 4, app: 2, hwFit: 'SCALE-A2',  ipAccess: 'green',  ovhScore: 3.1, tooltip: 'Peu de validateurs mais ARPU élevé (SCALE-A2). Écosystème en croissance.' },
  { chain: 'Hyperliquid', color: '#00FF87', validator: 2, rpc: 2, app: 4, hwFit: 'HFT-grade', ipAccess: 'yellow', ovhScore: 2.4, tooltip: 'Seulement 21 validateurs. Opportunité sur la couche applicative.' },
  { chain: 'TON',         color: '#0088CC', validator: 3, rpc: 2, app: 3, hwFit: 'Advance-2', ipAccess: 'red',    ovhScore: 1.8, tooltip: 'OVH explicitement déconseillé par la TON Foundation (concentration géo).' },
];

const COLUMNS = [
  { key: 'validator', label: 'Validator' },
  { key: 'rpc',       label: 'RPC Node' },
  { key: 'app',       label: 'App Layer' },
];

function scoreCell(score: number): string {
  if (score === 5) return 'bg-emerald-500/70 text-emerald-100';
  if (score === 4) return 'bg-emerald-500/35 text-emerald-300';
  if (score === 3) return 'bg-amber-500/25 text-amber-300';
  if (score === 2) return 'bg-red-500/20 text-red-400';
  return 'bg-red-500/40 text-red-300';
}

function IpDot({ access }: { access: 'green' | 'yellow' | 'red' }) {
  const colors = { green: 'bg-emerald-400', yellow: 'bg-yellow-400', red: 'bg-red-400' };
  const labels = { green: '✓', yellow: '~', red: '✗' };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${colors[access]}/20`}>
      <span className={`text-[10px] font-black ${colors[access].replace('bg-', 'text-')}`}>{labels[access]}</span>
    </span>
  );
}

export default function StrategicHeatmap() {
  return (
    <ComingSoonCard
      title="Strategic Heatmap"
      description="Croisement besoins hardware × présence OVH pour définir les priorités"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-black text-white">Strategic Heatmap</h3>
            <p className="text-white/30 text-[10px] mt-0.5">Score d'opportunité OVH par chain et type de nœud</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-3 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-white/30 w-28">Chain</th>
                {COLUMNS.map(c => (
                  <th key={c.key} className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-white/30">{c.label}</th>
                ))}
                <th className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-white/30">HW Fit</th>
                <th className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-white/30">IP Access</th>
                <th className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[#00F0FF]/50">OVH Score</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(row => (
                <tr key={row.chain} className="border-b border-white/5 hover:bg-white/2 transition-colors group/row" title={row.tooltip}>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                      <span className="text-white/70 font-bold">{row.chain}</span>
                    </span>
                  </td>
                  {COLUMNS.map(c => {
                    const val = row[c.key as keyof typeof row] as number;
                    return (
                      <td key={c.key} className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${scoreCell(val)}`}>
                          {'★'.repeat(val)}<span className="opacity-25">{'★'.repeat(5 - val)}</span>
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    <span className="text-[9px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded">{row.hwFit}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <IpDot access={row.ipAccess} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-sm font-black ${row.ovhScore >= 4 ? 'text-[#00F0FF]' : row.ovhScore >= 3 ? 'text-amber-400' : 'text-red-400/60'}`}>
                      {row.ovhScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-white/20 mt-2 italic">* Survoler une ligne pour voir le raisonnement · OVH Score = moyenne pondérée (Validator 40%, RPC 30%, App 20%, IP 10%)</p>
      </div>
    </ComingSoonCard>
  );
}

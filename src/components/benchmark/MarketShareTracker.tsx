'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ComingSoonCard } from './ComingSoonCard';

const PROVIDER_COLORS: Record<string, string> = {
  OVHcloud: '#00F0FF',
  Hetzner: '#F97316',
  AWS: '#FACC15',
  'Google Cloud': '#3B82F6',
  Others: '#6B7280',
};

const DATA: Record<string, { name: string; value: number }[]> = {
  Solana: [
    { name: 'OVHcloud', value: 16.2 },
    { name: 'Hetzner', value: 23.8 },
    { name: 'AWS', value: 19.4 },
    { name: 'Google Cloud', value: 9.1 },
    { name: 'Others', value: 31.5 },
  ],
  Ethereum: [
    { name: 'OVHcloud', value: 14.8 },
    { name: 'Hetzner', value: 18.2 },
    { name: 'AWS', value: 21.6 },
    { name: 'Google Cloud', value: 12.4 },
    { name: 'Others', value: 33.0 },
  ],
  Avalanche: [
    { name: 'OVHcloud', value: 13.6 },
    { name: 'Hetzner', value: 20.4 },
    { name: 'AWS', value: 17.8 },
    { name: 'Google Cloud', value: 8.9 },
    { name: 'Others', value: 39.3 },
  ],
  Sui: [
    { name: 'OVHcloud', value: 14.8 },
    { name: 'Hetzner', value: 22.1 },
    { name: 'AWS', value: 18.3 },
    { name: 'Google Cloud', value: 10.2 },
    { name: 'Others', value: 34.6 },
  ],
};

const CHAINS = ['Solana', 'Ethereum', 'Avalanche', 'Sui'] as const;

export default function MarketShareTracker() {
  const [activeChain, setActiveChain] = useState<string>('Solana');
  const data = DATA[activeChain];
  const ovhShare = data.find(d => d.name === 'OVHcloud')?.value ?? 0;

  return (
    <ComingSoonCard
      title="Market Share Tracker"
      description="Dynamic tracking of OVH footprint vs competitors"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">Market Share Tracker</h3>
            <p className="text-white/30 text-[10px] mt-0.5">Distribution by infrastructure provider</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: '#00F0FF' }}>{ovhShare}%</div>
            <div className="text-[9px] text-white/30 uppercase tracking-widest">OVH share</div>
          </div>
        </div>

        {/* Chain tabs */}
        <div className="flex gap-1 mb-5">
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

        {/* Bar chart */}
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} width={80} />
            <Tooltip
              contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Share']}
            />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={PROVIDER_COLORS[entry.name] ?? '#6B7280'} opacity={entry.name === 'OVHcloud' ? 1 : 0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <p className="text-[9px] text-white/20 mt-3 italic">* Simulated data based on ASN detection</p>
      </div>
    </ComingSoonCard>
  );
}

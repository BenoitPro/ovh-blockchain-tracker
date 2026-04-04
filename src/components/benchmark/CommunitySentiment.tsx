'use client';

import { useState } from 'react';
import { ComingSoonCard } from './ComingSoonCard';

interface Mention {
  text: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface ChainSentiment {
  chain: string;
  color: string;
  score: number;
  trend: number;
  discordSources: number;
  telegramSources: number;
  twitterSources: number;
  topics: { label: string; sentiment: 'positive' | 'neutral' | 'negative' }[];
  mentions: Mention[];
}

const CHAINS_DATA: ChainSentiment[] = [
  {
    chain: 'Solana',
    color: '#9945FF',
    score: 74,
    trend: 3,
    discordSources: 8,
    telegramSources: 3,
    twitterSources: 2,
    topics: [
      { label: 'Latence', sentiment: 'positive' },
      { label: 'Pricing', sentiment: 'neutral' },
      { label: 'Support', sentiment: 'positive' },
    ],
    mentions: [
      { text: 'OVH low-latency Frankfurt really solid for Solana validators this month', source: 'Solana Validators Discord', date: '2 days ago', sentiment: 'positive' },
      { text: 'Had a downtime on OVH Paris but support was responsive', source: 'Solana Tech Telegram', date: '5 days ago', sentiment: 'neutral' },
      { text: 'Anyone else seeing better slot times on OVH vs Hetzner?', source: 'Validators United Discord', date: '1 week ago', sentiment: 'positive' },
    ],
  },
  {
    chain: 'Ethereum',
    color: '#627EEA',
    score: 61,
    trend: 0,
    discordSources: 12,
    telegramSources: 5,
    twitterSources: 4,
    topics: [
      { label: 'Latence', sentiment: 'positive' },
      { label: 'Pricing', sentiment: 'neutral' },
      { label: 'Support', sentiment: 'neutral' },
    ],
    mentions: [
      { text: 'OVH Advance-2 handles attestations well, no issues past 2 weeks', source: 'EthStaker Discord', date: '3 days ago', sentiment: 'positive' },
      { text: 'Comparing OVH vs Hetzner for large ETH validator setups — pricing competitive', source: 'Ethereum Infra Telegram', date: '1 week ago', sentiment: 'neutral' },
      { text: 'OVH IP ranges sometimes flagged by MEV relays, worth checking', source: 'MEV Builders Discord', date: '10 days ago', sentiment: 'negative' },
    ],
  },
  {
    chain: 'Avalanche',
    color: '#E84142',
    score: 58,
    trend: -2,
    discordSources: 4,
    telegramSources: 2,
    twitterSources: 1,
    topics: [
      { label: 'Latence', sentiment: 'neutral' },
      { label: 'Pricing', sentiment: 'positive' },
      { label: 'Support', sentiment: 'neutral' },
    ],
    mentions: [
      { text: 'Using OVH for AVAX validators, uptime has been good', source: 'AVAX Validators Discord', date: '4 days ago', sentiment: 'positive' },
      { text: 'OVH pricing is competitive but bandwidth limits can be an issue for L1s', source: 'Avalanche Infra Telegram', date: '2 weeks ago', sentiment: 'neutral' },
      { text: 'Anyone running Avalanche subnets on OVH? Looking for feedback', source: 'AVAX Builders Discord', date: '2 weeks ago', sentiment: 'neutral' },
    ],
  },
  {
    chain: 'Sui',
    color: '#4DA2FF',
    score: 43,
    trend: -5,
    discordSources: 3,
    telegramSources: 2,
    twitterSources: 1,
    topics: [
      { label: 'Latence', sentiment: 'neutral' },
      { label: 'Pricing', sentiment: 'neutral' },
      { label: 'Support', sentiment: 'negative' },
    ],
    mentions: [
      { text: 'Sui requires high RAM, OVH SCALE range is technically suitable', source: 'Sui Validators Discord', date: '1 week ago', sentiment: 'neutral' },
      { text: 'Not many Sui validators using OVH yet, ecosystem still maturing', source: 'Sui Infra Telegram', date: '2 weeks ago', sentiment: 'neutral' },
      { text: 'OVH network peering not ideal for Sui consensus latency requirements', source: 'Sui Tech Discord', date: '3 weeks ago', sentiment: 'negative' },
    ],
  },
];

function sentimentColor(s: 'positive' | 'neutral' | 'negative') {
  return s === 'positive' ? 'text-emerald-400' : s === 'negative' ? 'text-red-400' : 'text-amber-400';
}

function sentimentBg(s: 'positive' | 'neutral' | 'negative') {
  return s === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : s === 'negative' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400';
}

function scoreColor(score: number) {
  if (score >= 65) return '#10B981';
  if (score >= 45) return '#F59E0B';
  return '#EF4444';
}

export default function CommunitySentiment() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const totalSources = CHAINS_DATA.reduce((sum, c) => sum + c.discordSources + c.telegramSources + c.twitterSources, 0);

  return (
    <ComingSoonCard
      title="Community Sentiment"
      description="Monitoring réputation OVH sur les communautés validateurs"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">Community Sentiment</h3>
            <p className="text-white/30 text-[10px] mt-0.5">{totalSources} sources monitorées [mock]</p>
          </div>
        </div>

        {/* Chain list */}
        <div className="flex flex-col gap-1.5 mb-4">
          {CHAINS_DATA.map(chain => (
            <div key={chain.chain} className="rounded-lg border border-white/5 overflow-hidden">
              {/* Row */}
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/3 transition-colors text-left"
                onClick={() => setExpanded(expanded === chain.chain ? null : chain.chain)}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: chain.color }} />
                <span className="text-xs font-bold text-white w-20">{chain.chain}</span>

                {/* Score bar */}
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${chain.score}%`, background: scoreColor(chain.score) }}
                  />
                </div>

                <span className="text-xs font-black w-8 text-right" style={{ color: scoreColor(chain.score) }}>
                  {chain.score}%
                </span>
                <span className={`text-[10px] w-8 text-right ${chain.trend > 0 ? 'text-emerald-400' : chain.trend < 0 ? 'text-red-400' : 'text-white/30'}`}>
                  {chain.trend > 0 ? `+${chain.trend}` : chain.trend === 0 ? '—' : chain.trend}
                </span>
                <span className="text-white/20 text-xs ml-1">{expanded === chain.chain ? '▲' : '▼'}</span>
              </button>

              {/* Dropdown detail */}
              {expanded === chain.chain && (
                <div className="px-3 pb-3 border-t border-white/5">
                  {/* Sources */}
                  <div className="flex gap-3 mt-2.5 mb-3">
                    <span className="text-[9px] text-white/30">
                      Discord <span className="text-white/60 font-bold">{chain.discordSources}</span>
                    </span>
                    <span className="text-[9px] text-white/30">
                      Telegram <span className="text-white/60 font-bold">{chain.telegramSources}</span>
                    </span>
                    <span className="text-[9px] text-white/30">
                      Twitter <span className="text-white/60 font-bold">{chain.twitterSources}</span>
                    </span>
                  </div>

                  {/* Topics */}
                  <div className="flex gap-1.5 mb-3">
                    {chain.topics.map(t => (
                      <span key={t.label} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sentimentBg(t.sentiment)}`}>
                        {t.label}
                      </span>
                    ))}
                  </div>

                  {/* Mentions */}
                  <div className="flex flex-col gap-2">
                    {chain.mentions.map((m, i) => (
                      <div key={i} className="bg-white/3 rounded-lg p-2.5">
                        <p className="text-[10px] text-white/60 leading-relaxed italic">"{m.text}"</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-bold ${sentimentColor(m.sentiment)}`}>●</span>
                          <span className="text-[9px] text-white/30">{m.source}</span>
                          <span className="text-[9px] text-white/20 ml-auto">{m.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Weekly report */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 hover:bg-white/3 transition-colors"
          onClick={() => setReportOpen(!reportOpen)}
        >
          <span className="text-[10px] font-bold text-white/50">Rapport hebdomadaire [mock]</span>
          <span className="text-white/20 text-xs">{reportOpen ? '▲' : '▼'}</span>
        </button>
        {reportOpen && (
          <div className="mt-2 px-3 py-3 rounded-lg border border-white/5 bg-white/2">
            <ul className="flex flex-col gap-2">
              <li className="text-[10px] text-white/50 leading-relaxed">• Sentiment OVH globalement stable cette semaine. Solana reste le marché le plus positif (74%), porté par les retours sur la latence Frankfurt.</li>
              <li className="text-[10px] text-white/50 leading-relaxed">• Point d'attention sur Ethereum : mention de problèmes de compatibilité avec certains relais MEV. À surveiller.</li>
              <li className="text-[10px] text-white/50 leading-relaxed">• Sui en baisse de 5 points — l'écosystème validateurs est encore petit et les retours sur les performances réseau restent mitigés.</li>
            </ul>
          </div>
        )}
      </div>
    </ComingSoonCard>
  );
}

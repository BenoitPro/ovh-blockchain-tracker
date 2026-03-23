'use client';

import ParticlesBackground from '@/components/ParticlesBackground';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';

const ACCENT = '#627EEA';

const cases = [
    {
        company: 'EthStaker',
        role: 'Ethereum Solo Staking Community',
        chains: ['ETH'],
        description:
            'EthStaker is a non-profit community organization supporting Ethereum solo stakers and validator decentralization. After testing OVHcloud infrastructure since 2020, they officially partnered in 2024, recommending OVHcloud to their global community and offering exclusive discount codes to members.',
        quote:
            "OVHcloud stood out because of their unmetered public bandwidth — critical since Ethereum nodes use between 500 GB and 4 TB per month. Add crypto-friendly policies, redundant network infrastructure, and transparent pricing with no hidden fees, and it's the obvious choice for solo stakers.",
        person: 'EthStaker Team',
        highlights: ['Unmetered bandwidth', 'Crypto-friendly policies', 'Community discount program', 'Testnet validator support'],
        source: 'https://www.ovhcloud.com/en/case-studies/ethstaker/',
    },
    {
        company: 'BWare Labs — Blast API',
        role: 'Multi-Chain Blockchain RPC API Provider',
        chains: ['ETH'],
        description:
            'BWare Labs built Blast, a multi-chain API endpoint platform giving developers access to blockchain data at scale across 55+ EVM-compatible chains. After their previous hyperscaler struggled to scale, OVHcloud Advance Dedicated Servers won on performance, price, and network resilience.',
        quote:
            'We are very happy to take advantage of the new range, which provides high-capacity storage and superior processing power. Our collaboration with OVHcloud has been very fruitful since we started using the platform.',
        person: 'Flavian Manea, CEO at Bware Labs & Radu Enoiu, CPO',
        highlights: ['55+ EVM chains', 'AMD EPYC 4004 servers', 'NVMe storage', 'Anti-DDoS + 5 Gbps'],
        source: 'https://www.ovhcloud.com/en/case-studies/bware-labs/',
    },
    {
        company: 'Everstake',
        role: 'Multi-Chain Validator Operations',
        chains: ['SOL', 'ETH'],
        description:
            'One of the largest non-custodial staking providers globally with $7B+ in staked assets and 1M+ delegators across 80+ PoS networks. Everstake consolidated its validator infrastructure on OVHcloud, reducing vendor count by 50%+ and achieving fast, predictable provisioning for both Ethereum and Solana nodes.',
        quote:
            'Whenever new capacity is needed, servers can be reliably deployed in minutes, helping Everstake maintain uninterrupted validator operations across multiple networks. The transparent, fair pricing make scaling infrastructure on demand efficient and straightforward.',
        person: 'Denys Avierin, CIO at Everstake',
        highlights: ['$7B+ staked assets', '1M+ delegators', '80+ PoS networks', '99.98% reliability'],
        source: 'https://www.ovhcloud.com/en/case-studies/everstake/',
    },
    {
        company: 'Stakely',
        role: 'Non-Custodial Staking Provider',
        chains: ['SOL', 'ETH'],
        description:
            'Stakely operates validator nodes across 40+ PoS networks including Ethereum (mainnet + L2) and Solana, with sentry nodes on OVHcloud Advance Servers and signer nodes on Public Cloud instances connected via vRack private network.',
        quote:
            "We required a powerful and reliable platform to host our staking services — and OVHcloud servers delivered in every way. Other providers simply couldn't match OVHcloud in terms of cost, performance, support or geolocation, and we were delighted to find a partner that shared our sustainability values.",
        person: 'Jose Antonio Hernandez, CEO at Stakely',
        highlights: ['40+ PoS networks', 'vRack private network', '1.3 Tbit/s Anti-DDoS', 'Sentry + signer arch'],
        source: 'https://www.ovhcloud.com/en/case-studies/stakely/',
    },
];

function ChainBadge({ chain }: { chain: string }) {
    const isSol = chain === 'SOL';
    return (
        <span
            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
                background: isSol ? 'rgba(0,240,255,0.12)' : 'rgba(98,126,234,0.12)',
                color: isSol ? '#00F0FF' : '#627EEA',
                border: `1px solid ${isSol ? '#00F0FF30' : '#627EEA30'}`,
            }}
        >
            {isSol ? '◎ Solana' : 'Ξ Ethereum'}
        </span>
    );
}

interface UseCaseCardProps {
    company: string;
    role: string;
    chains: string[];
    description: string;
    quote: string;
    person: string;
    highlights: string[];
    source: string;
    accent: string;
}

function UseCaseCard({ company, role, chains, description, quote, person, highlights, source, accent }: UseCaseCardProps) {
    return (
        <div
            className="rounded-2xl p-6 md:p-8 border bg-black/30 backdrop-blur-xl transition-all duration-300"
            style={{
                borderColor: `${accent}18`,
                boxShadow: `0 4px 40px ${accent}08`,
            }}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-xl font-black tracking-tight" style={{ color: '#1e293b' }}>{company}</h2>
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold mt-0.5" style={{ color: accent }}>
                        {role}
                    </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    {chains.map((ch) => (
                        <ChainBadge key={ch} chain={ch} />
                    ))}
                </div>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#64748b' }}>{description}</p>

            {/* Quote */}
            <blockquote
                className="relative pl-5 mb-5 italic text-sm leading-relaxed"
                style={{ borderLeft: `3px solid ${accent}60`, color: '#334155' }}
            >
                <span className="text-4xl leading-none absolute -left-1 -top-3 opacity-20 font-serif" style={{ color: accent }}>
                    "
                </span>
                {quote}
                <footer className="mt-2 text-[10px] not-italic font-bold uppercase tracking-wider" style={{ color: `${accent}80` }}>
                    — {person}
                </footer>
            </blockquote>

            {/* Highlights */}
            <div className="flex flex-wrap gap-2 mb-5">
                {highlights.map((h) => (
                    <span
                        key={h}
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{
                            background: `${accent}08`,
                            color: `${accent}90`,
                            border: `1px solid ${accent}20`,
                        }}
                    >
                        {h}
                    </span>
                ))}
            </div>

            {/* Source link */}
            <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 opacity-50 hover:opacity-100"
                style={{ color: accent }}
            >
                Read full case study on OVHcloud
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        </div>
    );
}

export default function EthereumUseCasesPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050510]">
            <ParticlesBackground />

            <div className="relative z-10">
                <main className="p-6 w-full max-w-4xl mx-auto">
                    <AnimatedTagline
                        title="Use Cases"
                        subtitle="How Ethereum builders trust OVHcloud for node infrastructure"
                        accentColor={ACCENT}
                    />

                    {/* Stats banner */}
                    <div
                        className="mb-10 rounded-2xl p-5 border bg-black/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-around gap-4 text-center"
                        style={{
                            borderColor: `${ACCENT}18`,
                            boxShadow: `0 2px 30px ${ACCENT}08`,
                        }}
                    >
                        <div>
                            <p className="text-3xl font-black" style={{ color: ACCENT }}>~10%</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold mt-1">of Ethereum nodes hosted</p>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-white/10" />
                        <div>
                            <p className="text-3xl font-black text-white">~4%</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold mt-1">of ETH 2.0 staking share</p>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-white/10" />
                        <div>
                            <p className="text-3xl font-black text-white">2×</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold mt-1">MarketsandMarkets "Star"</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8 pb-24">
                        {cases.map((c) => (
                            <UseCaseCard key={c.company} {...c} accent={ACCENT} />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}

'use client';

import ParticlesBackground from '@/components/ParticlesBackground';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';

const ACCENT = '#00F0FF';

const cases = [
    {
        company: 'Dysnix / Mizar',
        role: 'Dedicated Solana RPC & Base Full Nodes',
        chains: ['SOL', 'ETH'],
        description:
            'Dysnix, a Web3 DevOps consultancy, built dedicated Solana RPC and Base full nodes on OVHcloud for Mizar, a crypto trading platform powering real-time DEX analytics, wallet intelligence, AI labeling, and trading automation.',
        quote:
            'The gRPC stream is the fastest way to get live data from Solana, and the RPC calls have minimal latency. It took just 2–3 days to get the Solana node running from when it was requested.',
        person: 'Francesco Ciuci, CEO & Co-Founder, Mizar',
        highlights: ['2–3 day provisioning', 'Minimal RPC latency', 'gRPC stream access', 'Custom monitoring dashboard'],
        source: 'https://www.ovhcloud.com/en/case-studies/dysnix/',
    },
    {
        company: 'Everstake',
        role: 'Multi-Chain Validator Operations',
        chains: ['SOL', 'ETH'],
        description:
            'One of the largest non-custodial staking providers globally with $7B+ in staked assets and 1M+ delegators across 80+ PoS networks. Everstake consolidated its validator infrastructure on OVHcloud, reducing vendor count by 50%+ and eliminating performance bottlenecks.',
        quote:
            'By working with OVHcloud, we have been able to eliminate our previous performance bottlenecks and operational inefficiencies. The fast provisioning times, modern hardware, and predictable pricing provided an immediate improvement in infrastructure scalability and cost management.',
        person: 'Denys Avierin, CIO at Everstake',
        highlights: ['$7B+ staked assets', '1M+ delegators', '80+ PoS networks', '99.98% reliability'],
        source: 'https://www.ovhcloud.com/en/case-studies/everstake/',
    },
    {
        company: 'Stakely',
        role: 'Non-Custodial Staking Provider',
        chains: ['SOL', 'ETH'],
        description:
            'Stakely operates validator nodes across 40+ PoS networks including Solana, Ethereum, and Cosmos SDK chains. After evaluating multiple providers, no competitor could match OVHcloud on cost, performance, support, and geographic distribution.',
        quote:
            "We required a powerful and reliable platform to host our staking services — and OVHcloud servers delivered in every way. Other providers simply couldn't match OVHcloud in terms of cost, performance, support or geolocation, and we were delighted to find a partner that shared our sustainability values.",
        person: 'Jose Antonio Hernandez, CEO at Stakely',
        highlights: ['40+ PoS networks', 'Global geo-distribution', '1.3 Tbit/s Anti-DDoS', 'Water-cooled infra'],
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
            className="rounded-2xl p-6 md:p-8 border border-white/8 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/15"
            style={{ boxShadow: `0 4px 40px ${accent}08` }}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight">{company}</h2>
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
            <p className="text-sm text-white/55 leading-relaxed mb-5">{description}</p>

            {/* Quote */}
            <blockquote
                className="relative pl-5 mb-5 italic text-sm leading-relaxed text-white/75"
                style={{ borderLeft: `3px solid ${accent}50` }}
            >
                <span className="text-4xl leading-none absolute -left-1 -top-3 opacity-20 font-serif" style={{ color: accent }}>
                    "
                </span>
                {quote}
                <footer className="mt-2 text-[10px] not-italic font-bold uppercase tracking-wider text-white/35">
                    — {person}
                </footer>
            </blockquote>

            {/* Highlights */}
            <div className="flex flex-wrap gap-2 mb-5">
                {highlights.map((h) => (
                    <span
                        key={h}
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-white/50 border border-white/8"
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

export default function UseCasesPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050510]">
            <ParticlesBackground />

            <div className="relative z-10">
                <main className="p-6 w-full max-w-4xl mx-auto">
                    <AnimatedTagline
                        title="Use Cases"
                        subtitle="How blockchain builders trust OVHcloud for Solana infrastructure"
                        accentColor={ACCENT}
                    />

                    {/* Stats banner */}
                    <div
                        className="mb-10 rounded-2xl p-5 border border-white/8 bg-black/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-around gap-4 text-center"
                        style={{ boxShadow: `0 2px 30px ${ACCENT}08` }}
                    >
                        <div>
                            <p className="text-3xl font-black" style={{ color: ACCENT }}>~15%</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold mt-1">of Solana nodes hosted</p>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-white/10" />
                        <div>
                            <p className="text-3xl font-black text-white">#1</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold mt-1">general cloud provider on Solana</p>
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

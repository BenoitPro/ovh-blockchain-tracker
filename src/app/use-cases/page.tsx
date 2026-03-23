'use client';

import Link from 'next/link';
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
        image: '/images/use-cases/mizar-solana.png',
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
        image: '/images/use-cases/everstake-solana.png',
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
        image: '/images/use-cases/stakely-solana.png',
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
    image: string;
}

function UseCaseCard({ company, role, chains, description, quote, person, highlights, source, accent, image }: UseCaseCardProps) {
    return (
        <div
            className="rounded-2xl border border-white/8 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/15 overflow-hidden group"
            style={{ boxShadow: `0 4px 40px ${accent}08` }}
        >
            {/* Image section */}
            <div className="relative h-48 w-full overflow-hidden border-b border-white/8">
                <img 
                    src={image} 
                    alt={company} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="p-6 md:p-8">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                        {/* Solana Nodes */}
                        <div 
                            className="rounded-xl p-3 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-white/15"
                            style={{ boxShadow: `0 2px 20px ${ACCENT}05` }}
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Solana Nodes</p>
                             <p className="text-2xl font-black" style={{ color: ACCENT }}>~15%</p>
                             <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">of the network</p>
                        </div>
                        {/* Blockchain Support */}
                        <div 
                            className="rounded-xl p-3 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-white/15"
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Chains Support</p>
                             <p className="text-2xl font-black text-white">100+</p>
                             <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">L1 & L2 networks</p>
                        </div>
                        {/* Global Ranking */}
                        <div 
                            className="rounded-xl p-3 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-white/15"
                            style={{ boxShadow: `0 2px 20px ${ACCENT}05` }}
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Global Ranking</p>
                             <p className="text-2xl font-black" style={{ color: ACCENT }}>#1</p>
                             <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">Generalist Cloud</p>
                        </div>
                         {/* Data Centers */}
                         <div 
                            className="rounded-xl p-3 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-white/15"
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Infra Reach</p>
                             <p className="text-2xl font-black text-white">46</p>
                             <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">Datacenters</p>
                        </div>
                        {/* Industry Star */}
                        <div 
                            className="rounded-xl p-3 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-white/15"
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Industry Leader</p>
                             <p className="text-2xl font-black text-white">2×</p>
                             <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">MarketsandMarkets</p>
                        </div>
                    </div>

                    <p className="text-[9px] text-center text-white/40 mb-12 uppercase tracking-[0.22em] font-medium max-w-3xl mx-auto leading-relaxed">
                        Supporting all architectures, from standard RPC/ERPC endpoints to<br className="hidden sm:block" /> 
                        complex institutional nodes: <span className="text-white/70">Bare Metal</span> • 
                        <span className="text-white/70">Public Cloud</span> • 
                        <span className="text-white/70">Hybrid Solutions</span>
                    </p>

                    <div className="flex flex-col gap-8">
                        {cases.map((c) => (
                            <UseCaseCard key={c.company} {...c} accent={ACCENT} />
                        ))}
                    </div>

                    {/* Final CTA section */}
                    <div className="mt-16 mb-24 p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl text-center">
                        <h3 className="text-xl font-black text-white mb-3">Ready to Build?</h3>
                        <p className="text-sm text-white/40 mb-8 max-w-lg mx-auto leading-relaxed">
                            Explore our official blockchain ecosystem or connect with our specialized team to design your next infrastructure.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-black font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                            >
                                Visit Official Hub
                            </a>
                            <Link
                                href="/about#contact-section"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/20 text-white font-black uppercase tracking-widest text-[11px] transition-all hover:bg-white/5 hover:border-white/40 active:scale-95"
                            >
                                Contact Experts
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

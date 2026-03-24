'use client';

import Link from 'next/link';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';

const ACCENT = '#627EEA';

const cases = [
// ... (rest of cases)
    {
        company: 'Secretarium',
        role: 'Confidential Computing & TPaaS',
        chains: ['ETH', 'Multi-Cloud'],
        description:
            'Secretarium partnered with OVHcloud to build and deliver its pioneering TPaaS (Trust Platform as a Service) solution, Klave, leveraging confidential computing to ensure data privacy and security for institutional clients.',
        quote:
            "OVHcloud's solutions gave us the capabilities and flexibility to grow according to our business and technical needs. Their commitment to sovereignty and security aligns perfectly with our vision for Klave.",
        person: 'Secretarium Team',
        highlights: ['TPaaS Solution', 'Intel SGX Support', 'Data Sovereignty', 'Confidential Computing'],
        source: 'https://www.ovhcloud.com/en/case-studies/secretarium/',
        logo: 'https://logo.clearbit.com/secretarium.com',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2940&auto=format&fit=crop',
    },
    {
        company: 'EthStaker',
        role: 'Ethereum Solo Staking Community',
        chains: ['ETH'],
        description:
            'EthStaker is a non-profit community organization supporting Ethereum solo stakers and validator decentralization. After testing OVHcloud infrastructure since 2020, they officially partnered in 2024, recommending OVHcloud to their global community.',
        quote:
            "OVHcloud stood out because of their unmetered public bandwidth — critical since Ethereum nodes use between 500 GB and 4 TB per month. Add crypto-friendly policies, and it's the obvious choice for solo stakers.",
        person: 'EthStaker Team',
        highlights: ['Unmetered bandwidth', 'Crypto-friendly policies', 'Community discount', 'Testnet support'],
        source: 'https://www.ovhcloud.com/en/case-studies/ethstaker/',
        logo: 'https://logo.clearbit.com/ethstaker.cc',
        image: '/images/use-cases/ethstaker-ethereum.png',
    },
    {
        company: 'BWare Labs — Blast API',
        role: 'Multi-Chain Blockchain RPC API Provider',
        chains: ['ETH'],
        description:
            'BWare Labs built Blast, a multi-chain API endpoint platform giving developers access to blockchain data at scale. After their previous hyperscaler struggled to scale, OVHcloud Advance Dedicated Servers won on performance.',
        quote:
            'We are very happy to take advantage of the new range, which provides high-capacity storage and superior processing power. Our collaboration with OVHcloud has been very fruitful.',
        person: 'Flavian Manea, CEO at Bware Labs',
        highlights: ['55+ EVM chains', 'AMD EPYC 4004', 'NVMe storage', 'Anti-DDoS + 5 Gbps'],
        source: 'https://www.ovhcloud.com/en/case-studies/bware-labs/',
        logo: 'https://logo.clearbit.com/bwarelabs.com',
        image: '/images/use-cases/blast-ethereum.png',
    },
    {
        company: 'Diomedes Technologies',
        role: 'High-Frequency Trading & Liquidity',
        chains: ['SOL', 'ETH', 'BTC'],
        description:
            'Diomedes Technologies is a high-frequency trading firm focused on cryptocurrency markets. They leverage advanced trading algorithms to swiftly and effectively capitalize on market movements.',
        quote:
            'As a company focused on high-frequency trading, we needed infrastructure that could keep up with our pace. OVHcloud gave us the technical foundation to grow fast and offer the best solutions.',
        person: 'Diomedes Team',
        highlights: ['Ultra-low latency', 'High-speed networking', 'Bare Metal performance', 'Global connectivity'],
        source: 'https://www.ovhcloud.com/en/case-studies/diomedes/',
        logo: 'https://logo.clearbit.com/diomedestech.com',
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop',
    },
    {
        company: 'Everstake',
        role: 'Multi-Chain Validator Operations',
        chains: ['SOL', 'ETH'],
        description:
            'One of the largest non-custodial staking providers globally with $7B+ in staked assets. Everstake consolidated its validator infrastructure on OVHcloud, reducing vendor count by 50%+ and achieving fast, predictable provisioning.',
        quote:
            'Whenever new capacity is needed, servers can be reliably deployed in minutes, helping Everstake maintain uninterrupted validator operations. The transparent, fair pricing make scaling efficient.',
        person: 'Denys Avierin, CIO at Everstake',
        highlights: ['$7B+ staked assets', '1M+ delegators', '80+ networks', '99.98% reliability'],
        source: 'https://www.ovhcloud.com/en/case-studies/everstake/',
        logo: 'https://logo.clearbit.com/everstake.one',
        image: '/images/use-cases/everstake-ethereum.png',
    },
    {
        company: 'Stakely',
        role: 'Non-Custodial Staking Provider',
        chains: ['SOL', 'ETH'],
        description:
            'Stakely operates validator nodes across 40+ PoS networks including Ethereum and Solana. After evaluating multiple providers, no competitor could match OVHcloud on cost and performance.',
        quote:
            "We required a powerful and reliable platform to host our staking services — and OVHcloud servers delivered in every way. Other providers simply couldn't match OVHcloud in terms of cost or geolocation.",
        person: 'Jose Antonio Hernandez, CEO at Stakely',
        highlights: ['40+ networks', 'vRack private network', '1.3 Tbit/s Anti-DDoS', 'Sentry + signer arch'],
        source: 'https://www.ovhcloud.com/en/case-studies/stakely/',
        logo: 'https://logo.clearbit.com/stakely.io',
        image: '/images/use-cases/stakely-ethereum.png',
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
    image?: string;
    logo?: string;
}

function UseCaseCard({ company, role, chains, description, quote, person, highlights, source, accent, image, logo }: UseCaseCardProps) {
    return (
        <div
            className="group rounded-3xl overflow-hidden border bg-white/60 backdrop-blur-xl transition-all duration-500 hover:bg-white/80 flex flex-col h-full"
            style={{
                borderColor: `${accent}20`,
                boxShadow: `0 4px 40px ${accent}08`,
            }}
        >
            {/* Banner Image */}
            {image && (
                <div className="relative h-48 w-full overflow-hidden">
                    <img 
                        src={image} 
                        alt={company} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent" />
                    
                    {/* Logo Overlay */}
                    {logo && (
                        <div className="absolute bottom-4 left-6 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white p-2 shadow-xl border border-slate-100">
                                <img src={logo} alt={`${company} logo`} className="w-full h-full object-contain" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="p-6 md:p-8 flex flex-col flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                    <div>
                        {!image && logo && (
                             <div className="w-10 h-10 rounded-lg bg-white p-1.5 mb-3 border border-slate-100">
                                 <img src={logo} alt={`${company} logo`} className="w-full h-full object-contain" />
                             </div>
                        )}
                        <h2 className="text-xl font-black tracking-tight leading-tight" style={{ color: '#1e293b' }}>{company}</h2>
                        <p className="text-[11px] uppercase tracking-[0.18em] font-bold mt-1" style={{ color: accent }}>
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
                <p className="text-sm leading-relaxed mb-6 line-clamp-3 group-hover:line-clamp-none transition-all duration-300" style={{ color: '#64748b' }}>
                    {description}
                </p>

                {/* Quote */}
                <div className="mt-auto">
                    <blockquote
                        className="relative pl-5 mb-6 italic text-sm leading-relaxed"
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
                    <div className="flex flex-wrap gap-2 mb-6">
                        {highlights.map((h) => (
                            <span
                                key={h}
                                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors"
                                style={{
                                    background: `${accent}08`,
                                    color: `${accent}90`,
                                    borderColor: `${accent}20`,
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
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200"
                        style={{ color: accent }}
                    >
                        Read Case Study
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function EthereumUseCasesPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="relative z-10">
                <main className="p-6 w-full max-w-4xl mx-auto">
                    <AnimatedTagline
                        title="Use Cases"
                        subtitle="How Ethereum builders trust OVHcloud for node infrastructure"
                        accentColor={ACCENT}
                    />

                    {/* Stats banner */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Ethereum Nodes', value: '~10%', sub: 'of the network', accent: true },
                            { label: 'Global Ranking', value: '#2', sub: 'Blockchain Cloud', accent: true },
                            { label: 'Infra Reach', value: '46', sub: 'Datacenters', accent: false },
                            { label: 'Industry Leader', value: '2×', sub: 'MarketsandMarkets', accent: false },
                        ].map(({ label, value, sub, accent }) => (
                            <div
                                key={label}
                                className="rounded-xl p-3 border bg-white/60 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:bg-white/80"
                                style={{ borderColor: `${ACCENT}20`, boxShadow: `0 2px 12px ${ACCENT}06` }}
                            >
                                <p className="text-[8px] uppercase tracking-[0.15em] text-slate-400 font-bold">{label}</p>
                                <p className="text-2xl font-black" style={{ color: accent ? ACCENT : '#1e293b' }}>{value}</p>
                                <p className="text-[8px] text-slate-400 uppercase tracking-[0.1em]">{sub}</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-[9px] text-center text-slate-400 mb-12 uppercase tracking-[0.22em] font-medium max-w-3xl mx-auto leading-relaxed">
                        Supporting all architectures, from standard RPC/ERPC endpoints to<br className="hidden sm:block" />
                        complex institutional nodes: <span className="text-slate-600">Bare Metal</span> •{' '}
                        <span className="text-slate-600">Public Cloud</span> •{' '}
                        <span className="text-slate-600">Hybrid Solutions</span>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {cases.map((c) => (
                            <UseCaseCard key={c.company} {...c} accent={ACCENT} />
                        ))}
                    </div>

                    {/* Final CTA section */}
                    <div className="mt-16 mb-24 p-8 rounded-3xl border bg-white/60 backdrop-blur-xl text-center"
                        style={{ borderColor: `${ACCENT}20`, boxShadow: `0 4px 40px ${ACCENT}08` }}>
                        <h3 className="text-xl font-black text-slate-800 mb-3">Ready to Build?</h3>
                        <p className="text-sm text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
                            Explore our official blockchain ecosystem or connect with our specialized team to design your next infrastructure.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95 text-white"
                                style={{ background: ACCENT, boxShadow: `0 0 24px ${ACCENT}40` }}
                            >
                                Visit Official Hub
                            </a>
                            <Link
                                href="/about#contact-section"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all hover:bg-[#627EEA]/5 active:scale-95"
                                style={{ border: `1px solid ${ACCENT}30`, color: ACCENT }}
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

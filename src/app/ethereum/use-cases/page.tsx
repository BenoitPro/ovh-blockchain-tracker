'use client';

import Link from 'next/link';
import ParticlesBackground from '@/components/ParticlesBackground';
import BlockchainCubes from '@/components/BlockchainCubes';
import VerifiedResidentsGrid from '@/components/dashboard/VerifiedResidentsGrid';

const ACCENT = '#627EEA';

const cases = [
    {
        company: 'EthStaker',
        role: 'Solo Staking Community',
        chains: ['ETH'],
        description:
            'EthStaker is the leading community for Ethereum solo stakers, helping thousands of individuals run their own validators. OVHcloud stood out as one of the few providers with crypto-friendly policies and unmetered public bandwidth — critical for the bandwidth-heavy nature of Ethereum nodes.',
        quote:
            'OVHcloud stood out because of their unmetered public bandwidth — critical since Ethereum nodes use between 500 GB and 4 TB monthly.',
        person: 'EthStaker Team',
        highlights: ['Unmetered bandwidth', 'Crypto-friendly policies', 'Community discounts', 'Solo validator support'],
        source: 'https://www.ovhcloud.com/en/lp/powering-blockchain-ethos/',
        logo: '/images/logos/ethstaker.png',
    },
    {
        company: 'BWare Labs — Blast API',
        role: 'Multi-Chain RPC Provider',
        chains: ['ETH'],
        description:
            'BWare Labs operates Blast API, a distributed multi-chain RPC platform supporting 55+ EVM-compatible chains. They leverage OVHcloud bare metal servers powered by AMD EPYC 4004 processors combined with enterprise-grade Anti-DDoS protection to deliver high-performance blockchain access.',
        quote:
            'We are very happy with the new range, which provides high-capacity storage and superior processing power.',
        person: 'Flavian Manea, CEO at BWare Labs',
        highlights: ['55+ EVM chains', 'AMD EPYC 4004', 'Anti-DDoS protection', 'High-capacity storage'],
        source: 'https://www.ovhcloud.com/en/case-studies/bware-labs/',
        logo: '/images/logos/bware.png',
    },
    {
        company: 'Secretarium',
        role: 'Confidential Computing & TPaaS',
        chains: ['ETH'],
        description:
            'Secretarium partnered with OVHcloud to build and deliver its pioneering TPaaS (Trust Platform as a Service) solution, Klave, leveraging confidential computing to ensure data privacy and security for institutional clients.',
        quote:
            "OVHcloud's solutions gave us the capabilities and flexibility to grow according to our business and technical needs. Their commitment to sovereignty and security aligns perfectly with our vision for Klave.",
        person: 'Secretarium Team',
        highlights: ['TPaaS Solution', 'Intel SGX Support', 'Data Sovereignty', 'Confidential Computing'],
        source: 'https://www.ovhcloud.com/en/case-studies/secretarium/',
        logo: '/images/logos/secretarium.png',
    },
    {
        company: 'Everstake',
        role: 'Multi-Chain Validator Operations',
        chains: ['ETH', 'SOL'],
        description:
            'One of the largest non-custodial staking providers globally with $7B+ in staked assets and 1M+ delegators across 80+ PoS networks. Everstake consolidated its validator infrastructure on OVHcloud, reducing vendor count by 50%+ and eliminating performance bottlenecks.',
        quote:
            'By working with OVHcloud, we have been able to eliminate our previous performance bottlenecks and operational inefficiencies. The fast provisioning times, modern hardware, and predictable pricing provided an immediate improvement in infrastructure scalability and cost management.',
        person: 'Denys Avierin, CIO at Everstake',
        highlights: ['$7B+ staked assets', '1M+ delegators', '80+ PoS networks', '99.98% reliability'],
        source: 'https://www.ovhcloud.com/en/case-studies/everstake/',
        logo: '/images/logos/everstake.png',
    },
    {
        company: 'Stakely',
        role: 'Non-Custodial Staking Provider',
        chains: ['ETH', 'SOL'],
        description:
            'Stakely operates validator nodes across 40+ PoS networks including Ethereum, Solana, and Cosmos SDK chains. After evaluating multiple providers, no competitor could match OVHcloud on cost, performance, support, and geographic distribution.',
        quote:
            "We required a powerful and reliable platform to host our staking services — and OVHcloud servers delivered in every way. Other providers simply couldn't match OVHcloud in terms of cost, performance, support or geolocation, and we were delighted to find a partner that shared our sustainability values.",
        person: 'Jose Antonio Hernandez, CEO at Stakely',
        highlights: ['40+ PoS networks', 'Global geo-distribution', '1.3 Tbit/s Anti-DDoS', 'vRack private network'],
        source: 'https://www.ovhcloud.com/en/case-studies/stakely/',
        logo: '/images/logos/stakely.png',
    },
    {
        company: 'Diomedes Technologies',
        role: 'High-Frequency Trading & Liquidity',
        chains: ['ETH', 'SOL', 'BTC'],
        description:
            'Diomedes Technologies is a high-frequency trading firm focused on cryptocurrency markets. They leverage advanced trading algorithms to swiftly capitalize on market movements, with a strong emphasis on continuous performance optimization and innovation.',
        quote:
            'As a company focused on high-frequency trading, we needed infrastructure that could keep up with our pace - both in terms of performance and flexibility. OVHcloud gave us the technical foundation to grow fast and offer the best solutions for our clients.',
        person: 'Diomedes Team',
        highlights: ['Ultra-low latency', 'High-speed networking', 'Bare Metal performance', 'Global connectivity'],
        source: 'https://www.ovhcloud.com/en/case-studies/diomedes/',
        logo: '/images/logos/diomedes.png',
    },
];

function ChainBadge({ chain }: { chain: string }) {
    let color = '#ffffff';
    let bg = 'rgba(255,255,255,0.08)';
    let label = chain;

    if (chain === 'SOL') {
        color = '#00F0FF';
        bg = 'rgba(0,240,255,0.12)';
        label = '◎ Solana';
    } else if (chain === 'ETH') {
        color = '#627EEA';
        bg = 'rgba(98,126,234,0.12)';
        label = 'Ξ Ethereum';
    } else if (chain === 'BTC') {
        color = '#f59e0b';
        bg = 'rgba(245,158,11,0.08)';
        label = '₿ Bitcoin';
    }

    return (
        <span
            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-current"
            style={{ color, backgroundColor: bg }}
        >
            {label}
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
    logo?: string;
}

function UseCaseCard({ company, role, chains, description, quote, person, highlights, source, logo }: UseCaseCardProps) {
    return (
        <div
            className="group rounded-3xl overflow-hidden border border-white/8 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:border-white/15 flex flex-col h-full p-6 md:p-8"
            style={{ boxShadow: `0 4px 40px ${ACCENT}08` }}
        >
            {logo && (
                <div className="w-16 h-16 mb-6 flex items-center justify-start group-hover:scale-105 transition-transform duration-500">
                    <img src={logo} alt={`${company} logo`} className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
                </div>
            )}

            <div className="flex flex-col flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight leading-tight">{company}</h2>
                        <p className="text-[11px] uppercase tracking-[0.18em] font-bold mt-1" style={{ color: ACCENT }}>
                            {role}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap flex-shrink-0">
                        {chains.map((ch) => (
                            <ChainBadge key={ch} chain={ch} />
                        ))}
                    </div>
                </div>

                <p className="text-sm text-white/55 leading-relaxed mb-6 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                    {description}
                </p>

                <div className="mt-auto">
                    <blockquote
                        className="relative pl-5 mb-6 italic text-sm leading-relaxed text-white/75"
                        style={{ borderLeft: `3px solid ${ACCENT}50` }}
                    >
                        <span className="text-4xl leading-none absolute -left-1 -top-3 opacity-20 font-serif" style={{ color: ACCENT }}>
                            "
                        </span>
                        {quote}
                        <footer className="mt-2 text-[10px] not-italic font-bold uppercase tracking-wider text-white/35">
                            — {person}
                        </footer>
                    </blockquote>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {highlights.map((h) => (
                            <span
                                key={h}
                                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8 group-hover:border-white/20 transition-colors"
                            >
                                {h}
                            </span>
                        ))}
                    </div>

                    <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200"
                        style={{ color: ACCENT }}
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
        <div className="min-h-screen relative overflow-hidden bg-[#050510]">
            <BlockchainCubes opacity={0.03} />
            <ParticlesBackground />

            <div className="relative z-10">
                <main className="p-6 w-full max-w-5xl mx-auto">

                    {/* Header */}
                    <div className="pt-10 pb-12 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Ethereum Infrastructure</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                            Use Cases
                        </h1>
                        <p className="text-white/40 text-sm max-w-xl mx-auto leading-relaxed">
                            How Ethereum builders leverage OVHcloud's sovereign infrastructure — from solo stakers to institutional validators.
                        </p>
                    </div>

                    {/* Stats banner */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
                        {[
                            { label: 'Ethereum Share', value: '~10%' },
                            { label: 'Global Ranking', value: '#2 Cloud' },
                            { label: 'Datacenters', value: '46' },
                            { label: 'Market Growth', value: '2×' },
                        ].map(({ label, value }) => (
                            <div key={label} className="rounded-xl p-4 border border-white/8 bg-black/30 text-center">
                                <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold mb-1">{label}</p>
                                <p className="text-2xl font-black" style={{ color: ACCENT }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Infrastructure offerings */}
                    <div className="mb-14 p-6 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4">Infrastructure Offerings</h2>
                        <div className="flex flex-wrap gap-3">
                            {['Standard RPC / ERPC', 'Complex Institutional Nodes', 'Bare Metal', 'Public Cloud', 'Hybrid Solutions'].map((item) => (
                                <span
                                    key={item}
                                    className="text-[11px] font-bold px-3 py-1.5 rounded-full border text-white/60"
                                    style={{ borderColor: `${ACCENT}30`, backgroundColor: `${ACCENT}08` }}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Case Studies */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                        {cases.map((c) => (
                            <UseCaseCard key={c.company} {...c} />
                        ))}
                    </div>

                    {/* On-Chain Verified Section */}
                    <div className="mb-24 space-y-10">
                        <div className="flex items-end justify-between border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                On-Chain Verified <span style={{ color: ACCENT }}>Residents</span>
                            </h2>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Live Automated Discovery</p>
                        </div>

                        <VerifiedResidentsGrid chainId="ethereum" limit={6} />

                        <p className="text-center text-[10px] text-white/30 uppercase tracking-widest pt-8">
                            Our engine programmatically identifies validator identities via IP audits and on-chain data.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-16 mb-24 p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl text-center">
                        <h3 className="text-xl font-black text-white mb-3">Ready to Build on Ethereum?</h3>
                        <p className="text-sm text-white/40 mb-8 max-w-lg mx-auto leading-relaxed">
                            Connect with OVHcloud's specialized team to design your Ethereum infrastructure — from solo staking to institutional validator operations.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] text-black"
                                style={{ backgroundColor: ACCENT }}
                            >
                                Visit Official Hub
                            </a>
                            <Link
                                href="/about#contact-section"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/20 text-white font-black uppercase tracking-widest text-[11px]"
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

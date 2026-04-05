'use client';

import Link from 'next/link';
import ParticlesBackground from '@/components/ParticlesBackground';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';

const ACCENT = '#E84142';

const cases = [
    {
        company: 'Bware Labs',
        role: 'Avalanche API Node & Validator',
        chains: ['AVAX', 'ETH', 'SOL'],
        description:
            'Bware Labs powers Blast, a fast blockchain API platform. By migrating their infrastructure to OVHcloud Advance Dedicated Servers, they were able to handle high institutional traffic with ultra-low latency while maintaining predictable costs and robust security via Intel SGX.',
        quote:
            'The move to OVHcloud allowed us to scale our decentralized infrastructure efficiently. The dedicated performance and global network are exactly what we needed to maintain 99.99% uptime for our RPC endpoints and validator nodes across Avalanche and other networks.',
        person: 'Bware Labs Team',
        highlights: ['Ultra-low latency', 'Intel SGX Security', 'Predictable pricing', 'Global Data Centers'],
        source: 'https://www.ovhcloud.com/en/case-studies/bware-labs/',
        logo: '/images/logos/bwarelabs.png',
    },
    {
        company: 'Everstake',
        role: 'Multi-Chain Validator Operations',
        chains: ['AVAX', 'SOL', 'ETH'],
        description:
            'One of the largest non-custodial staking providers globally. Everstake consolidated its validator infrastructure on OVHcloud to support dozens of PoS networks, including the resource-intensive Avalanche Primary Network, eliminating previous performance bottlenecks.',
        quote:
            'By working with OVHcloud, we have been able to eliminate our previous performance bottlenecks and operational inefficiencies. The fast provisioning times, modern hardware, and predictable pricing provided an immediate improvement in infrastructure scalability and cost management.',
        person: 'Denys Avierin, CIO at Everstake',
        highlights: ['$7B+ staked assets', 'Bare Metal NVMe', '80+ PoS networks', '99.98% reliability'],
        source: 'https://www.ovhcloud.com/en/case-studies/everstake/',
        logo: '/images/logos/everstake.png',
    },
    {
        company: 'Stakely',
        role: 'Non-Custodial Staking Provider',
        chains: ['AVAX', 'SOL', 'ETH'],
        description:
            'Stakely operates validator nodes across 40+ PoS networks. To meet Avalanche’s strict >3000 IOPS NVMe SSD and high processor frequency requirements, they chose OVHcloud’s dedicated servers which delivered superior performance without virtualization overhead.',
        quote:
            "We required a powerful and reliable platform to host our staking services — and OVHcloud servers delivered in every way. Other providers simply couldn't match OVHcloud in terms of cost, performance, support or geolocation, and we were delighted to find a partner that shared our sustainability values.",
        person: 'Jose Antonio Hernandez, CEO at Stakely',
        highlights: ['40+ PoS networks', 'Sustainable scaling', '1.3 Tbit/s Anti-DDoS', 'Water-cooled infra'],
        source: 'https://www.ovhcloud.com/en/case-studies/stakely/',
        logo: '/images/logos/stakely.png',
    },
];

function ChainBadge({ chain }: { chain: string }) {
    const isAvax = chain === 'AVAX';
    const isSol = chain === 'SOL';
    const isEth = chain === 'ETH';
    
    let color = '#ffffff';
    let bg = 'rgba(255,255,255,0.08)';
    let label = chain;

    if (isAvax) {
        color = '#E84142';
        bg = 'rgba(232, 65, 66, 0.12)';
        label = '🔺 Avalanche';
    } else if (isSol) {
        color = '#00F0FF';
        bg = 'rgba(0,240,255,0.12)';
        label = '◎ Solana';
    } else if (isEth) {
        color = '#627EEA';
        bg = 'rgba(98,126,234,0.12)';
        label = 'Ξ Ethereum';
    }

    return (
        <span
            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-current transition-all"
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
    accent: string;
    logo?: string;
}

function UseCaseCard({ company, role, chains, description, quote, person, highlights, source, accent, logo }: UseCaseCardProps) {
    return (
        <div
            className="group rounded-3xl overflow-hidden border border-white/8 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:border-[#E84142]/30 flex flex-col h-full p-6 md:p-8"
            style={{ boxShadow: `0 4px 40px ${accent}08` }}
        >
            {/* Logo above Title */}
            {logo && (
                <div className="w-16 h-16 mb-6 flex items-center justify-start group-hover:scale-105 transition-transform duration-500">
                    <img src={logo} alt={`${company} logo`} className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
                </div>
            )}

            <div className="flex flex-col flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight leading-tight">{company}</h2>
                        <p className="text-[11px] uppercase tracking-[0.18em] font-bold mt-1" style={{ color: accent }}>
                            {role}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                        {chains.map((ch) => (
                            <ChainBadge key={ch} chain={ch} />
                        ))}
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-white/55 leading-relaxed mb-6 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                    {description}
                </p>

                {/* Quote */}
                <div className="mt-auto">
                    <blockquote
                        className="relative pl-5 mb-6 italic text-sm leading-relaxed text-white/75"
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
                    <div className="flex flex-wrap gap-2 mb-6">
                        {highlights.map((h) => (
                            <span
                                key={h}
                                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8 group-hover:border-[#E84142]/40 group-hover:text-white/70 transition-colors"
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
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200 text-[#E84142]/70 hover:text-[#E84142]"
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

export default function AvalancheUseCasesPage() {
    return (
        <div 
            className="min-h-screen relative overflow-hidden" 
            style={{
                background: '#0a0404',
                backgroundImage: `
                    radial-gradient(ellipse at 20% 30%, rgba(232,65,66,0.09) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 70%, rgba(180,30,30,0.07) 0%, transparent 50%)
                `,
                backgroundAttachment: 'fixed'
            }}
        >
            <ParticlesBackground />

            <div className="relative z-10">
                <main className="p-6 w-full max-w-4xl mx-auto">
                    <AnimatedTagline
                        title={
                            <>Real-World <span style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}80` }}>Avalanche</span> Use Cases</>
                        }
                        subtitle="How builders leverage OVHcloud's raw performance for Subnets and Validators"
                    />

                    {/* Stats banner */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                        {/* Avalanche Nodes */}
                        <div 
                            className="rounded-xl p-3 border border-[#E84142]/20 bg-black/40 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-[#E84142]/40"
                            style={{ boxShadow: `0 2px 20px ${ACCENT}15` }}
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-[#E84142]/70 font-bold">Hosted Nodes</p>
                             <p className="text-2xl font-black" style={{ color: ACCENT }}>~19%</p>
                             <p className="text-[8px] text-white/30 uppercase tracking-[0.1em]">market share</p>
                        </div>
                        {/* Blockchain Support */}
                        <div 
                            className="rounded-xl p-3 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-white/15"
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Chains Support</p>
                             <p className="text-2xl font-black text-white">100+</p>
                             <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">L1 & L2 networks</p>
                        </div>
                        {/* Storage Performance */}
                        <div 
                            className="rounded-xl p-3 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-[#E84142]/30"
                            style={{ boxShadow: `0 2px 20px ${ACCENT}05` }}
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Bare Metal SSD</p>
                             <p className="text-2xl font-black text-white">NVMe</p>
                             <p className="text-[8px] text-[#E84142]/80 uppercase tracking-[0.1em]">3000+ IOPS Ready</p>
                        </div>
                         {/* Data Centers */}
                         <div 
                            className="rounded-xl p-3 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-white/15"
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Infra Reach</p>
                             <p className="text-2xl font-black text-white">46</p>
                             <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">Datacenters</p>
                        </div>
                        {/* Bandwidth */}
                        <div 
                            className="rounded-xl p-3 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all hover:border-white/15"
                        >
                             <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Secure Network</p>
                             <p className="text-2xl font-black text-white">vRack</p>
                             <p className="text-[8px] text-[#E84142]/80 uppercase tracking-[0.1em]">Private cluster</p>
                        </div>
                    </div>

                    <p className="text-[9px] text-center text-white/40 mb-12 uppercase tracking-[0.22em] font-medium max-w-3xl mx-auto leading-relaxed">
                        Enabling next-gen Avalanche architectures, from single API Endpoints to<br className="hidden sm:block" /> 
                        resource-intensive Subnet hosting: <span className="text-[#E84142]/80">Advance Servers</span> • 
                        <span className="text-[#E84142]/80">Intel SGX</span> • 
                        <span className="text-[#E84142]/80">High-IOPS NVMe</span>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {cases.map((c) => (
                            <UseCaseCard key={c.company} {...c} accent={ACCENT} />
                        ))}
                    </div>

                    {/* Final CTA section */}
                    <div className="mt-16 mb-24 p-8 rounded-3xl border border-[#E84142]/20 bg-gradient-to-b from-[#E84142]/10 to-transparent backdrop-blur-xl text-center">
                        <h3 className="text-xl font-black text-white mb-3">Ready to Build Your Subnet?</h3>
                        <p className="text-sm text-white/50 mb-8 max-w-lg mx-auto leading-relaxed">
                            Leverage OVHcloud's Bare Metal performance for your Avalanche validators and subnets. Connect with our Web3 experts to architecture your solution.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#E84142] hover:bg-[#D63A3A] text-white font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(232,65,66,0.25)]"
                            >
                                Visit Official Hub
                            </a>
                            <Link
                                href="/about#contact-section"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-[#E84142]/40 text-[#E84142] font-black uppercase tracking-widest text-[11px] transition-all hover:bg-[#E84142]/10 hover:border-[#E84142] active:scale-95"
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

'use client';

import Link from 'next/link';
import ParticlesBackground from '@/components/ParticlesBackground';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import UseCasesHero from '@/components/dashboard/UseCasesHero';
import OVHServerSpecs from '@/components/dashboard/OVHServerSpecs';

const ACCENT = '#F3BA2F';

const cases = [
    {
        title: 'RPC Infrastructure for dApps',
        role: 'BSC Full Node — Fast Sync',
        hardware: 'ADVANCE-2 · 32 GB · 2 TB NVMe',
        description:
            'BNB Chain dApps require fast, reliable JSON-RPC endpoints with low latency. OVHcloud ADVANCE-2 bare metal servers deliver the 2 TB NVMe storage required for BSC fast-sync, ensuring sub-50ms response times for Ethereum-compatible calls without the overhead of virtualisation.',
        highlights: ['2 TB NVMe fast-sync', 'EVM-compatible RPC', 'Predictable pricing', 'Anti-DDoS 1.3 Tbit/s'],
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
        ),
    },
    {
        title: 'Full Validator Operations',
        role: 'BNB Smart Chain Validator (post-Fermi)',
        hardware: 'SCALE-A1 · 128 GB · 7 TB NVMe',
        description:
            'The Fermi upgrade raised BNB Chain hardware requirements substantially. Running a full validator now demands 128 GB RAM and 7 TB NVMe storage. OVHcloud SCALE-A1 servers meet these specs with room to spare, enabling staking providers to capture block rewards reliably.',
        highlights: ['128 GB RAM spec', '7 TB NVMe storage', '~45 active validators', 'Bare metal performance'],
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        title: 'Archive Nodes for Analytics',
        role: 'BSC Archive — Erigon / Reth',
        hardware: 'SCALE-A1 · 128 GB · 10 TB NVMe',
        description:
            'Block explorers and on-chain analytics platforms (BscScan, Dune) require full archive nodes with complete historical state. Running Erigon or Reth on a 10 TB NVMe SCALE-A1 server cuts sync time dramatically compared to Geth-based archives, enabling instant historical queries at any block height.',
        highlights: ['10 TB NVMe archive', 'Erigon / Reth optimised', 'Full historical state', 'Block explorer ready'],
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
        ),
    },
];

interface UseCaseCardProps {
    title: string;
    role: string;
    hardware: string;
    description: string;
    highlights: string[];
    icon: React.ReactNode;
}

function UseCaseCard({ title, role, hardware, description, highlights, icon }: UseCaseCardProps) {
    return (
        <div
            className="group rounded-3xl overflow-hidden border border-white/8 bg-black/40 backdrop-blur-xl transition-all duration-500 flex flex-col h-full p-6 md:p-8"
            style={{ boxShadow: `0 4px 40px rgba(243, 186, 47, 0.04)` }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(243, 186, 47, 0.25)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
        >
            {/* Icon */}
            <div
                className="w-14 h-14 mb-6 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
                style={{
                    background: 'rgba(243, 186, 47, 0.1)',
                    border: '1px solid rgba(243, 186, 47, 0.2)',
                    color: ACCENT,
                }}
            >
                {icon}
            </div>

            <div className="flex flex-col flex-1">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-xl font-black text-white tracking-tight leading-tight mb-1">
                        {title}
                    </h2>
                    <p
                        className="text-[11px] uppercase tracking-[0.18em] font-bold"
                        style={{ color: ACCENT }}
                    >
                        {role}
                    </p>
                    <p className="text-[10px] font-mono text-white/30 mt-1">{hardware}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-white/55 leading-relaxed mb-6">
                    {description}
                </p>

                {/* Highlights */}
                <div className="mt-auto flex flex-wrap gap-2">
                    {highlights.map((h) => (
                        <span
                            key={h}
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8 group-hover:text-white/70 transition-colors"
                            style={{}}
                        >
                            {h}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function BNBChainUseCasesPage() {
    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                background: '#0a0800',
                backgroundImage: `
                    radial-gradient(ellipse at 20% 30%, rgba(243,186,47,0.07) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 70%, rgba(200,150,20,0.05) 0%, transparent 50%)
                `,
                backgroundAttachment: 'fixed',
            }}
        >
            <ParticlesBackground />

            <div className="relative z-10">
                <main className="p-6 w-full max-w-4xl mx-auto">
                    <AnimatedTagline
                        title={
                            <>
                                Real-World{' '}
                                <span
                                    style={{
                                        color: ACCENT,
                                        textShadow: `0 0 20px rgba(243, 186, 47, 0.5)`,
                                    }}
                                >
                                    BNB Chain
                                </span>{' '}
                                Use Cases
                            </>
                        }
                        subtitle="How builders leverage OVHcloud bare metal for BSC nodes and validators"
                    />

                    <UseCasesHero chainId="bnbchain" />

                    <OVHServerSpecs chainId="bnbchain" accent={ACCENT} />

                    <p className="text-[9px] text-center text-white/40 mb-12 uppercase tracking-[0.22em] font-medium max-w-3xl mx-auto leading-relaxed">
                        Enabling BSC infrastructure from lightweight RPC nodes to full validators:{' '}
                        <span style={{ color: `${ACCENT}CC` }}>ADVANCE Servers</span> •{' '}
                        <span style={{ color: `${ACCENT}CC` }}>SCALE Bare Metal</span> •{' '}
                        <span style={{ color: `${ACCENT}CC` }}>High-IOPS NVMe</span>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {cases.map((c) => (
                            <UseCaseCard key={c.title} {...c} />
                        ))}
                    </div>

                    {/* Final CTA */}
                    <div
                        className="mt-16 mb-24 p-8 rounded-3xl border backdrop-blur-xl text-center"
                        style={{
                            borderColor: 'rgba(243, 186, 47, 0.2)',
                            background: 'linear-gradient(to bottom, rgba(243, 186, 47, 0.08), transparent)',
                        }}
                    >
                        <h3 className="text-xl font-black text-white mb-3">
                            Ready to Deploy Your BNB Chain Node?
                        </h3>
                        <p className="text-sm text-white/50 mb-8 max-w-lg mx-auto leading-relaxed">
                            Leverage OVHcloud Bare Metal performance for your BSC validators, RPC endpoints,
                            and archive nodes. Connect with our Web3 experts to architect your solution.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-black font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: ACCENT,
                                    boxShadow: `0 0 30px rgba(243, 186, 47, 0.25)`,
                                }}
                            >
                                Visit Official Hub
                            </a>
                            <Link
                                href="/about#contact-section"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 border"
                                style={{
                                    color: ACCENT,
                                    borderColor: 'rgba(243, 186, 47, 0.4)',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(243, 186, 47, 0.1)';
                                    (e.currentTarget as HTMLElement).style.borderColor = ACCENT;
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(243, 186, 47, 0.4)';
                                }}
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

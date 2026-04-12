'use client';

import Link from 'next/link';
import ParticlesBackground from '@/components/ParticlesBackground';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import UseCasesHero from '@/components/dashboard/UseCasesHero';
import OVHServerSpecs from '@/components/dashboard/OVHServerSpecs';

const ACCENT = '#836EF9';

const cases = [
    {
        company: 'Validator Operators',
        role: 'Monad Consensus Participant (MonadBFT)',
        description:
            'Monad explicitly requires bare-metal or dedicated servers — cloud VMs are not officially supported due to sub-second timing requirements in MonadBFT consensus. OVHcloud dedicated servers meet the strict CPU base-clock requirement (4.5 GHz+) with options like the ADVANCE and SCALE lines, making them a natural fit for Monad validators seeking reliable, high-performance infrastructure.',
        highlights: ['Bare Metal Required', '4.5 GHz Base Clock', 'PCIe Gen4 NVMe', '300 Mbps Symmetric'],
    },
    {
        company: 'RPC / Full Node Operators',
        role: 'Monad Full Node & RPC Provider',
        description:
            "Full node operators serving JSON-RPC and WebSocket traffic benefit from OVHcloud's predictable bandwidth pricing and European data centers. Monad RPC nodes require the same hardware spec as validators (16 cores, 32 GB RAM, 2.5 TB NVMe PCIe Gen4) with a more relaxed bandwidth requirement (100 Mbps vs 300 Mbps for validators).",
        highlights: ['100 Mbps Minimum', 'JSON-RPC / WebSocket', 'Same hardware as validator', 'EU Data Sovereignty'],
    },
];

interface UseCaseCardProps {
    company: string;
    role: string;
    description: string;
    highlights: string[];
    accent: string;
}

function UseCaseCard({ company, role, description, highlights, accent }: UseCaseCardProps) {
    return (
        <div
            className="group rounded-3xl overflow-hidden border border-white/8 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:border-[#836EF9]/30 flex flex-col h-full p-6 md:p-8"
            style={{ boxShadow: `0 4px 40px ${accent}08` }}
        >
            <div className="flex flex-col flex-1">
                {/* Header */}
                <div className="mb-5">
                    <h2 className="text-xl font-black text-white tracking-tight leading-tight">{company}</h2>
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold mt-1" style={{ color: accent }}>
                        {role}
                    </p>
                </div>

                {/* Description */}
                <p className="text-sm text-white/55 leading-relaxed mb-6 line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                    {description}
                </p>

                {/* Highlights */}
                <div className="mt-auto flex flex-wrap gap-2">
                    {highlights.map((h) => (
                        <span
                            key={h}
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8 group-hover:border-[#836EF9]/40 group-hover:text-white/70 transition-colors"
                        >
                            {h}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function MonadUseCasesPage() {
    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                background: '#08070f',
                backgroundImage: `
                    radial-gradient(ellipse at 20% 30%, rgba(131,110,249,0.09) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 70%, rgba(90,70,200,0.07) 0%, transparent 50%)
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
                                <span style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}80` }}>Monad</span>{' '}
                                Use Cases
                            </>
                        }
                        subtitle="Why MonadBFT demands bare-metal — and how OVHcloud delivers the performance validators need"
                    />

                    <UseCasesHero chainId="monad" />

                    <OVHServerSpecs chainId="monad" accent={ACCENT} />

                    <p className="text-[9px] text-center text-white/40 mb-12 uppercase tracking-[0.22em] font-medium max-w-3xl mx-auto leading-relaxed">
                        Powering next-gen Monad infrastructure, from consensus-critical validators to<br className="hidden sm:block" />
                        high-throughput RPC endpoints:{' '}
                        <span style={{ color: `${ACCENT}CC` }}>Advance Servers</span> •{' '}
                        <span style={{ color: `${ACCENT}CC` }}>4.5 GHz Base Clock</span> •{' '}
                        <span style={{ color: `${ACCENT}CC` }}>PCIe Gen4 NVMe</span>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {cases.map((c) => (
                            <UseCaseCard key={c.company} {...c} accent={ACCENT} />
                        ))}
                    </div>

                    {/* Final CTA section */}
                    <div
                        className="mt-16 mb-24 p-8 rounded-3xl border backdrop-blur-xl text-center"
                        style={{
                            borderColor: `${ACCENT}33`,
                            background: `linear-gradient(to bottom, ${ACCENT}1A, transparent)`,
                        }}
                    >
                        <h3 className="text-xl font-black text-white mb-3">Ready to Run Your Monad Node?</h3>
                        <p className="text-sm text-white/50 mb-8 max-w-lg mx-auto leading-relaxed">
                            Leverage OVHcloud&#39;s Bare Metal performance for your Monad validators and RPC infrastructure.
                            Connect with our Web3 experts to architect your solution.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95 text-white"
                                style={{
                                    background: ACCENT,
                                    boxShadow: `0 0 30px ${ACCENT}40`,
                                }}
                            >
                                Visit Official Hub
                            </a>
                            <Link
                                href="/about#contact-section"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95"
                                style={{
                                    border: `1px solid ${ACCENT}66`,
                                    color: ACCENT,
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${ACCENT}1A`;
                                    (e.currentTarget as HTMLAnchorElement).style.borderColor = ACCENT;
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                                    (e.currentTarget as HTMLAnchorElement).style.borderColor = `${ACCENT}66`;
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

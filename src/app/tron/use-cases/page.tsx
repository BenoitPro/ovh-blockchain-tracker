'use client';

import Header from '@/components/dashboard/Header';
import ParticlesBackground from '@/components/ParticlesBackground';
import VerifiedResidentsGrid from '@/components/dashboard/VerifiedResidentsGrid';
import UseCasesHero from '@/components/dashboard/UseCasesHero';
import OVHServerSpecs from '@/components/dashboard/OVHServerSpecs';

const TRON_RED = '#FF060A';

export default function TronUseCasesPage() {
    const bgStyle = { background: '#0a0000' };

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto tron-theme" style={bgStyle}>
            <ParticlesBackground />

            <div className="relative z-10 flex flex-col min-h-screen p-4 lg:p-8 xl:p-10 max-w-[1200px] mx-auto">
                <Header network="Tron" subtitle="Real-Time Infrastructure Monitoring" />

                <div className="mt-8">
                    <UseCasesHero chainId="tron" />
                    <div className="mt-16">
                        <OVHServerSpecs chainId="tron" accent={TRON_RED} />
                    </div>
                </div>

                <div className="mt-16 space-y-24">
                    {/* Main Partnership Description */}
                    <div className="glass-card p-12 relative overflow-hidden group">
                        <div
                            className="absolute top-0 right-0 w-96 h-96 blur-[120px] -translate-y-1/2 translate-x-1/2 transition-all duration-700"
                            style={{ background: `${TRON_RED}08`, }}
                        />

                        <div className="relative z-10 max-w-3xl border-l-[3px] pl-10" style={{ borderColor: TRON_RED }}>
                            <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">
                                Verified{' '}
                                <span style={{ color: TRON_RED }}>Infrastructure Audits</span>
                            </h2>
                            <p className="text-xl text-gray-300 leading-relaxed mb-8">
                                Our <strong>On-Chain</strong> monitoring engine programmatically identifies TRON network nodes and Super Representative candidates leveraging OVHcloud&apos;s industrial-grade infrastructure to power the TRON blockchain.
                            </p>
                            <p className="text-gray-400 text-sm italic">
                                — Automated Infrastructure Audit Source
                            </p>
                        </div>
                    </div>

                    {/* Live Automated Discovery Section */}
                    <div className="space-y-10">
                        <div className="flex items-end justify-between">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                On-Chain Verified{' '}
                                <span style={{ color: TRON_RED }}>Residents</span>
                            </h2>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Live Discovery Active</p>
                        </div>

                        <VerifiedResidentsGrid chainId="tron" limit={6} />
                    </div>

                    {/* Methodology Highlight */}
                    <div className="text-center max-w-2xl mx-auto py-20 pb-40">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/12 rounded-full mb-6">
                            <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: TRON_RED }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Continuously Syncing</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            We analyze the TRON network node set in real-time using specialized on-chain tools to verify infrastructure integrity. New node residents are automatically surfacing as they transition to OVHcloud infrastructure.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import Header from '@/components/dashboard/Header';
import ParticlesBackground from '@/components/ParticlesBackground';
import UseCasesHero from '@/components/dashboard/UseCasesHero';
import OVHServerSpecs from '@/components/dashboard/OVHServerSpecs';

const CELESTIA_PURPLE = '#7B2FBE';

export default function CelestiaUseCasesPage() {
    const bgStyle = { background: '#080414' };

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto celestia-theme" style={bgStyle}>
            <ParticlesBackground />
            <div className="relative z-10 flex flex-col min-h-screen p-4 lg:p-8 xl:p-10 max-w-[1200px] mx-auto">
                <Header network="Celestia" subtitle="Real-Time Infrastructure Monitoring" />

                <div className="mt-8">
                    <UseCasesHero chainId="celestia" />
                    <div className="mt-16">
                        <OVHServerSpecs chainId="celestia" accent={CELESTIA_PURPLE} />
                    </div>
                </div>

                <div className="mt-16 space-y-24">
                    {/* Partnership description card */}
                    <div className="glass-card p-12 relative overflow-hidden group">
                        <div
                            className="absolute top-0 right-0 w-96 h-96 blur-[120px] -translate-y-1/2 translate-x-1/2"
                            style={{ background: `${CELESTIA_PURPLE}08` }}
                        />
                        <div className="relative z-10 max-w-3xl border-l-[3px] pl-10" style={{ borderColor: CELESTIA_PURPLE }}>
                            <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">
                                Verified <span style={{ color: CELESTIA_PURPLE }}>Infrastructure Audits</span>
                            </h2>
                            <p className="text-xl text-gray-300 leading-relaxed mb-8">
                                Our <strong>On-Chain</strong> monitoring engine identifies Celestia network nodes leveraging OVHcloud&apos;s industrial-grade infrastructure to power the data availability layer of the modular blockchain ecosystem.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

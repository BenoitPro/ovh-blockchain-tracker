'use client';

import ParticlesBackground from '@/components/ParticlesBackground';
import RevenueProjection from '@/components/benchmark/RevenueProjection';
import HighSpendProspecting from '@/components/benchmark/HighSpendProspecting';

export default function RevenuePage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050510]">
            <ParticlesBackground />

            <div className="relative z-10">
                <main className="p-6 w-full max-w-5xl mx-auto">

                    {/* Header */}
                    <div className="pt-10 pb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Internal — Restricted Access</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                            Revenue
                        </h1>
                        <p className="text-white/40 text-sm max-w-xl leading-relaxed">
                            Live revenue estimates, projection simulator, and high-spend prospects across all tracked blockchains.
                        </p>
                    </div>

                    {/* Revenue Projection */}
                    <div className="mb-16">
                        <RevenueProjection />
                    </div>

                    {/* High-Spend Prospecting */}
                    <div className="mb-24">
                        <HighSpendProspecting />
                    </div>

                </main>
            </div>
        </div>
    );
}

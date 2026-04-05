'use client';

import Header from '@/components/dashboard/Header';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import BlockchainCubes from '@/components/BlockchainCubes';
import ParticlesBackground from '@/components/ParticlesBackground';

// Placeholder data for Hyperliquid 
// Based on actual stats from research (24 nodes, potentially centralized)
const HYPERLIQUID_DATA = [
    {
        key: 'amazon',
        label: 'AWS',
        nodeCount: 16,
        marketShare: 66.6,
        color: '#FF9900'
    },
    {
        key: 'google',
        label: 'GCP',
        nodeCount: 4,
        marketShare: 16.6,
        color: '#4285F4'
    },
    {
        key: 'ovh',
        label: 'OVHcloud',
        nodeCount: 2,
        marketShare: 8.3,
        color: '#0050d7'
    },
    {
        key: 'others',
        label: 'Others',
        nodeCount: 2,
        marketShare: 8.5,
        color: '#6B7280'
    }
];

export default function HyperliquidDashboard() {
    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <BlockchainCubes opacity={0.05} count={8} />
            <ParticlesBackground />
        <main className="relative z-10 p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
            <Header network="Hyperliquid" subtitle="Hype Phase & Decentralization Tracking" />
            
            <div className="mt-8 mb-10">
                <AnimatedTagline text="TRACKING 24 VALIDATORS ACROSS THE GLOBE • HYPERLIQUID NETWORK CENTRALIZATION" />
            </div>

            {/* Centralization Hook for Marketing */}
            <div className="mb-12 relative overflow-hidden rounded-2xl p-8 border"
                style={{
                    background: 'linear-gradient(135deg, rgba(0, 229, 190, 0.05), rgba(0, 0, 0, 0.4))',
                    borderColor: 'rgba(0, 229, 190, 0.2)'
                }}>
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4" style={{ background: `rgba(0, 229, 190, 0.1)`, border: `1px solid rgba(0, 229, 190, 0.3)` }}>
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00E5BE' }} />
                            <span className="text-xs font-medium text-[#00E5BE] tracking-widest uppercase">AWS Reliance Index</span>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">66.6% <span className="text-[#00E5BE]">AWS Centralization</span></h2>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-lg mb-6">
                            Hyperliquid is currently the fastest-growing perpetual DEX with immense trading volume, yet relies on a small set of 24 validator nodes. Over 66% of the network’s critical infrastructure is running on AWS, presenting a major systemic risk.
                        </p>
                        <a href="/hyperliquid/decentralize" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all text-black hover:scale-105"
                           style={{ background: '#00E5BE', boxShadow: '0 0 20px rgba(0, 229, 190, 0.3)' }}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Help Decentralize
                        </a>
                    </div>
                </div>
                
                {/* Visual accent */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none"
                     style={{ background: 'radial-gradient(circle at right, #00E5BE 0%, transparent 60%)' }} />
            </div>

            <div className="mt-12 max-w-4xl">
                <ProviderComparison providerBreakdown={HYPERLIQUID_DATA} />
            </div>
            
        </main>
        </div>
    );
}

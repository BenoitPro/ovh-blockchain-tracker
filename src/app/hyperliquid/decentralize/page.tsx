'use client';

import Header from '@/components/dashboard/Header';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function DecentralizePage() {
    return (
        <div className="relative min-h-screen">
            <ParticlesBackground />
        <main className="relative z-10 p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
            <Header network="Hyperliquid" subtitle="Bare Metal Matchmaker & Deployment Guides" />
            
            <div className="mt-8 mb-12 max-w-4xl">
                <h1 className="text-3xl font-black text-white mb-6 uppercase tracking-widest">
                    Help Decentralize <span className="text-[#00E5BE]">Hyperliquid</span>
                </h1>

                {/* AWS Tokyo reality banner */}
                <div className="mb-8 rounded-2xl border p-6" style={{ background: 'rgba(255,153,0,0.05)', borderColor: 'rgba(255,153,0,0.25)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Current State — April 2026</span>
                    </div>
                    <p className="text-white font-semibold text-lg mb-2">
                        All 24 validators are on <span className="text-orange-300">AWS Tokyo (ap-northeast-1)</span>
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Hyperliquid made a deliberate architectural choice: co-locating all validators in a single AWS region in Tokyo minimizes consensus latency and enables sub-millisecond order matching — critical for a perpetual futures DEX. The downside is a single point of failure: any AWS ap-northeast-1 outage takes down the entire network. There is no geographic or cloud redundancy today.
                    </p>
                </div>

                {/* OVH hybrid opportunity */}
                <div className="mb-8 rounded-2xl border p-6" style={{ background: 'rgba(0,229,190,0.04)', borderColor: 'rgba(0,229,190,0.2)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-[#00E5BE] animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#00E5BE]">OVH Hybrid Opportunity</span>
                    </div>
                    <p className="text-white font-semibold text-lg mb-2">
                        A first step: OVH gossip nodes alongside AWS validators
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        Hyperliquid separates <strong className="text-white">validators</strong> (consensus, require Tokyo co-location for performance) from <strong className="text-white">non-validator gossip nodes</strong> (sync state, can run anywhere). Deploying OVHcloud Bare Metal servers as gossip nodes in Europe or North America would:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-400 mb-4">
                        <li className="flex items-start gap-3">
                            <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#00E5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Break the 100% AWS dependency — cloud diversification without touching validator performance
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#00E5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Improve data availability for EU/US users — better chain state access from European infrastructure
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#00E5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Position OVHcloud as the first non-AWS cloud represented on Hyperliquid infrastructure
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#00E5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Lay the groundwork for OVH validators if Hyperliquid extends consensus to multi-region in future versions
                        </li>
                    </ul>
                    <p className="text-xs text-gray-600 italic">
                        Gossip nodes connect via ports 4001/4002 and sync full chain state. They do not participate in consensus but are essential for data availability and network resilience.
                    </p>
                </div>

                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    Running a node requires specific hardware to process state natively without falling behind. OVHcloud Bare Metal offers the right match for these high-throughput requirements.
                </p>
                
                {/* Hardware Matchmaker */}
                <div className="bg-[#00E5BE]/5 border border-[#00E5BE]/20 rounded-2xl p-8 mb-10 relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00E5BE]" />
                    <div className="flex items-start justify-between flex-wrap gap-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Protocol Requirements</h2>
                            <ul className="text-gray-400 space-y-2 mt-4">
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[#00E5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    CPU: 32 vCores
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[#00E5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    RAM: 128 GB
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[#00E5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Storage: 1 TB NVMe SSD
                                </li>
                            </ul>
                        </div>
                        
                        <div className="bg-black/50 p-6 rounded-xl border border-white/10 flex-1 min-w-[300px]">
                            <div className="inline-flex px-3 py-1 rounded bg-[#0050d7] text-white text-[10px] font-bold uppercase tracking-widest mb-3">OVHcloud Match</div>
                            <h3 className="text-2xl font-bold text-white">ADV-2 Bare Metal</h3>
                            <p className="text-gray-400 mt-2 text-sm mb-4">AMD EPYC 7000 Series / 16C/32T / 128 GB RAM / 2x 1TB NVMe / 1 Gbps unmetered</p>
                            <a href="https://www.ovhcloud.com/en/bare-metal/advance/adv-2/" target="_blank" rel="noreferrer" className="block text-center w-full bg-white/10 hover:bg-white/20 transition-colors text-white py-2 rounded-lg font-bold text-sm">
                                View Specification
                            </a>
                        </div>
                    </div>
                </div>

                {/* Deployment Guide */}
                <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-4">
                    Deployment Guide
                </h2>
                <div className="space-y-4">
                    <div className="p-6 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold mb-1">1. Provision Server</h3>
                            <p className="text-sm text-gray-400">Order your ADV-2 server with Ubuntu 22.04 LTS</p>
                        </div>
                        <span className="text-[#00E5BE] font-bold">5 min</span>
                    </div>
                    <div className="p-6 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold mb-1">2. Run Setup Script</h3>
                            <p className="text-sm text-gray-400">Execute the 1-click installer to run the gossip node</p>
                        </div>
                        <span className="text-[#00E5BE] font-bold">10 min</span>
                    </div>
                    <div className="p-6 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold mb-1">3. Sync State</h3>
                            <p className="text-sm text-gray-400">Wait for Hyperliquid state to fully sync via gossipRootIps</p>
                        </div>
                        <span className="text-[#00E5BE] font-bold">~2 hours</span>
                    </div>
                </div>
            </div>
        </main>
        </div>
    );
}

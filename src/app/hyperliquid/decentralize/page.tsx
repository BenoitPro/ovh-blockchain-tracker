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
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    Hyperliquid is moving towards full decentralization. Running a node requires specific hardware to process state natively without falling behind. OVHcloud offers the perfect Bare Metal match for these high-throughput requirements.
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

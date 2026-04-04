'use client';

import ParticlesBackground from '@/components/ParticlesBackground';
import BlockchainCubes from '@/components/BlockchainCubes';

export default function EthereumNodesPage() {
    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto">
            {/* Animated Blockchain Cubes Background (Subtle for Eth) */}
            <BlockchainCubes opacity={0.03} />

            {/* Floating Starry Points Background */}
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12 max-w-3xl">

                {/* Header */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border"
                        style={{ color: '#627EEA', borderColor: '#627EEA40', background: '#627EEA0D' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#627EEA] animate-pulse" />
                        Coming Soon
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">
                        Ethereum Node Explorer
                    </h1>
                    <p className="text-slate-500 text-base leading-relaxed">
                        We are working on making individual Ethereum node exploration possible.
                        Here is why it is more complex than Solana.
                    </p>
                </div>

                {/* Explanation cards */}
                <div className="space-y-5">

                    <div className="rounded-2xl p-6 border border-[#627EEA]/15 bg-white/60 backdrop-blur-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#627EEA] mb-3">
                            Aggregated data, not individual nodes
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Our current source — the MigaLabs API — only returns statistical distributions:
                            number of nodes per provider, per country, per client. There is no endpoint exposing
                            a list of individual nodes with their IP addresses. This is sufficient to measure market
                            share, but makes node-by-node listing impossible.
                        </p>
                    </div>

                    <div className="rounded-2xl p-6 border border-[#627EEA]/15 bg-white/60 backdrop-blur-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#627EEA] mb-3">
                            A different discovery protocol than Solana
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            On Solana, each node broadcasts its IP via the Gossip protocol — a single RPC request
                            returns the full list of participants. On Ethereum, nodes are discovered via two distinct
                            protocols: <strong>devp2p</strong> for the execution layer (Geth, Reth...)
                            and <strong>libp2p</strong> for the consensus layer (Lighthouse, Prysm...). Crawling
                            both networks requires a dedicated node running continuously.
                        </p>
                    </div>

                    <div className="rounded-2xl p-6 border border-[#627EEA]/15 bg-white/60 backdrop-blur-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#627EEA] mb-3">
                            What is planned
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Integrating a source like <strong>Ethernodes.org</strong> would allow us to list
                            execution-layer nodes with their IP, client, country, and OS — and apply our
                            MaxMind enrichment to identify OVHcloud infrastructure. A concrete path forward,
                            in the near term.
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}

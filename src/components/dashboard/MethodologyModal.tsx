'use client';

import { useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import { CHAINS, ChainId } from '@/lib/chains';

export default function MethodologyModal() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useNetworkTheme();
    const network = theme as ChainId;
    const chainName = CHAINS[network]?.name || 'Network';

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl bg-white/5 border border-white/10 hover:border-[var(--chain-accent)]/50"
                style={{ '--hover-accent': 'var(--chain-accent)' } as React.CSSProperties}
            >
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-[var(--chain-accent)]" />
                <InformationCircleIcon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity text-[var(--chain-accent)]" />
                <span className="text-xs font-bold uppercase tracking-widest transition-colors text-white/70 group-hover:text-white">
                    Data Methodology
                </span>
            </button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-[#000E1E]/80 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-[#050510] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-[var(--chain-accent)]/10"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--chain-accent)]" />

                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <InformationCircleIcon className="w-5 h-5 text-[var(--chain-accent)]" />
                                    Methodology
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 text-sm leading-relaxed text-slate-300 space-y-4">
                                {network === 'solana' ? (
                                    <>
                                        <p>
                                            Data is sourced continuously. We align with the{' '}
                                            <a href="https://messari.io/report/evaluating-validator-decentralization-geographic-and-infrastructure-distribution-in-proof-of-stake-networks"
                                                target="_blank" rel="noopener noreferrer"
                                                className="underline hover:text-white transition-colors text-[var(--chain-accent)]">
                                                Messari Validator Report
                                            </a>{' '}framework for infrastructure decentralization.
                                        </p>
                                        <ol className="list-decimal list-outside ml-4 space-y-2">
                                            <li><strong className="text-white">Solana RPC:</strong> Full census of active execution nodes &amp; voting validators via gossip.</li>
                                            <li><strong className="text-white">ASN Resolution:</strong> IP addresses are mapped to their respective ISP autonomous systems via MaxMind GeoLite2.</li>
                                            <li><strong className="text-white">Live Indexing:</strong> This dashboard reflects near real-time network states.</li>
                                        </ol>
                                        <p className="pt-4 border-t border-white/10 text-xs text-slate-500 font-mono italic">
                                            Dataset: ~5,000 global nodes. Refreshed minutely.
                                        </p>
                                    </>
                                ) : network === 'ethereum' ? (
                                    <>
                                        <p>
                                            Ethereum execution-layer nodes are discovered via the <strong className="text-white">devp2p/discv4</strong> protocol using official crawler mechanics.
                                        </p>
                                        <ol className="list-decimal list-outside ml-4 space-y-2">
                                            <li><strong className="text-white">Crawl phase:</strong> Node discovery pinging the network for ~30-60 minutes natively.</li>
                                            <li><strong className="text-white">ASN Resolution:</strong> Exposed IP addresses are mapped to ISP/Host ASNs via MaxMind GeoLite2.</li>
                                            <li><strong className="text-white">Provider Matching:</strong> Final correlation against major cloud provider footprints.</li>
                                        </ol>
                                        <p className="pt-4 border-t border-white/10 text-xs text-slate-500 font-mono italic">
                                            Dataset: Snapshot-based (time-stamped). Updated periodically.
                                        </p>
                                    </>
                                ) : network === 'avalanche' ? (
                                    <>
                                        <p>
                                            Avalanche validator data is assembled from two complementary sources, each with a specific role.
                                        </p>
                                        <ol className="list-decimal list-outside ml-4 space-y-2">
                                            <li>
                                                <strong className="text-white">Canonical count — P-Chain:</strong> We call <code className="text-xs bg-white/10 px-1 rounded">platform.getCurrentValidators</code> on the Avalanche P-Chain to get the authoritative number of active stakers (~1 400). This is the ground truth for network size, but it returns <em>no IP addresses</em>.
                                            </li>
                                            <li>
                                                <strong className="text-white">IP discovery — multi-node crawl:</strong> We query 5 independent public RPC endpoints (AvaLabs, PublicNode, Ankr, BLAST, 1RPC) in parallel via <code className="text-xs bg-white/10 px-1 rounded">info.peers</code>. Results are deduplicated by <code className="text-xs bg-white/10 px-1 rounded">nodeID</code>. This yields roughly 50 % of validators — the rest do not expose a public IP through peer gossip (NAT, restricted connectivity, no public RPC).
                                            </li>
                                            <li>
                                                <strong className="text-white">ASN resolution:</strong> Public IPs from step 2 are mapped to cloud provider ASNs via MaxMind GeoLite2 (offline, &lt;1 ms/IP).
                                            </li>
                                            <li>
                                                <strong className="text-white">Assumed bias:</strong> OVH market share is calculated against IP-resolvable validators only. If non-visible validators are distributed similarly across providers, the share is representative. If they skew toward home/non-cloud infrastructure, it may be slightly overstated.
                                            </li>
                                            <li><strong className="text-white">Uptime:</strong> <code className="text-xs bg-white/10 px-1 rounded">observedUptime</code> measures the fraction of time the peer has been reachable from the queried node.</li>
                                        </ol>
                                        <p className="pt-4 border-t border-white/10 text-xs text-slate-500 font-mono italic">
                                            Dataset: P-Chain canonical count + 5-node IP crawl · ~50% IP coverage · Refreshed every 2 hours.
                                        </p>
                                    </>
                                ) : network === 'sui' ? (
                                    <>
                                        <p>
                                            Sui validator data is sourced via a single call to{' '}
                                            <strong className="text-white">suix_getLatestSuiSystemState</strong>{' '}
                                            on the Mysten Labs public RPC endpoint.
                                        </p>
                                        <ol className="list-decimal list-outside ml-4 space-y-2">
                                            <li>
                                                <strong className="text-white">Full validator set:</strong>{' '}
                                                Unlike peer-sampling approaches, Sui returns all ~116 active validators
                                                in a single response — giving 100% network coverage.
                                            </li>
                                            <li>
                                                <strong className="text-white">Address parsing:</strong>{' '}
                                                Validator IPs are extracted from libp2p multiaddr strings
                                                (<code className="text-xs bg-white/10 px-1 rounded">/ip4/X.X.X.X/tcp/8080</code>).
                                                Validators exposing DNS hostnames instead of IPs are skipped.
                                            </li>
                                            <li><strong className="text-white">ASN Resolution:</strong> IPs are mapped to cloud provider ASNs via MaxMind GeoLite2.</li>
                                            <li>
                                                <strong className="text-white">Voting Power share:</strong>{' '}
                                                OVH voting power share = Σ(OVH validator voting power) / total network voting power.
                                            </li>
                                        </ol>
                                        <p className="pt-4 border-t border-white/10 text-xs text-slate-500 font-mono italic">
                                            Dataset: ~116 validators · 100% coverage · Refreshed every 2 hours.
                                        </p>
                                    </>
                                ) : (
                                    /* Generic fallback for any future chain */
                                    <>
                                        <p>
                                            {chainName} node data is collected and mapped to cloud provider ASNs via MaxMind GeoLite2.
                                        </p>
                                        <ol className="list-decimal list-outside ml-4 space-y-2">
                                            <li><strong className="text-white">Node Discovery:</strong> Active network peers are discovered via the network&apos;s native peer protocol.</li>
                                            <li><strong className="text-white">ASN Resolution:</strong> IP addresses are mapped to ISP autonomous systems via MaxMind GeoLite2.</li>
                                            <li><strong className="text-white">Provider Matching:</strong> Final correlation against major cloud provider footprints, including OVHcloud ASNs.</li>
                                        </ol>
                                        <p className="pt-4 border-t border-white/10 text-xs text-slate-500 font-mono italic">
                                            Dataset refreshed periodically.
                                        </p>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

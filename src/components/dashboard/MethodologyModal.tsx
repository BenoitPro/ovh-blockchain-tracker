'use client';

import { useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface MethodologyModalProps {
    network: 'solana' | 'ethereum' | 'avalanche';
    accentColor?: string;
}

export default function MethodologyModal({ network, accentColor = '#00F0FF' }: MethodologyModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Trigger Button - now integrated smoothly */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-40 group flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl ${
                    network === 'ethereum'
                        ? 'bg-[#0d1117]/85 border border-[#627EEA]/40 hover:border-[#627EEA]/70'
                        : 'bg-white/5 border border-white/10 hover:border-white/30'
                }`}
                style={{ '--hover-accent': accentColor } as React.CSSProperties}
            >
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ background: accentColor }} />
                <InformationCircleIcon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: accentColor }} />
                <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                    network === 'ethereum'
                        ? 'text-slate-300 group-hover:text-white'
                        : 'text-white/70 group-hover:text-white'
                }`}>
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
                            className="relative w-full max-w-md bg-[#050510] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                            style={{ boxShadow: `0 0 40px ${accentColor}15` }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: accentColor }} />
                            
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <InformationCircleIcon className="w-5 h-5" style={{ color: accentColor }} />
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
                                                className="underline hover:text-white transition-colors" style={{ color: accentColor }}>
                                                Messari Validator Report
                                            </a>{' '}framework for infrastructure decentralization.
                                        </p>
                                        <ol className="list-decimal list-outside ml-4 space-y-2">
                                            <li><strong className="text-white">Solana RPC:</strong> Full census of active execution nodes & voting validators via gossip.</li>
                                            <li><strong className="text-white">ASN Resolution:</strong> IP addresses are mapped to their respective ISP autonomous systems taking part via MaxMind GeoLite2.</li>
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
                                ) : (
                                    /* Avalanche */
                                    <>
                                        <p>
                                            Avalanche Primary Network peers are discovered via the <strong className="text-white">info.peers</strong> JSON-RPC method.
                                        </p>
                                        <ol className="list-decimal list-outside ml-4 space-y-2">
                                            <li>
                                                <strong className="text-white">Single-node snapshot:</strong> We query AvaLabs' official public endpoint (<code className="text-xs bg-white/10 px-1 rounded">api.avax.network</code>). This returns peers <em>currently connected</em> to that node — a representative sample of the network, not the full canonical set.
                                            </li>
                                            <li>
                                                <strong className="text-white">Scope note:</strong> A single bootstrap node typically sees 400–700 of the ~1,700 active validators. Our market-share estimate is extrapolated from this sample. Multi-node crawling (Phase 1b) will improve coverage.
                                            </li>
                                            <li><strong className="text-white">ASN Resolution:</strong> Peer public IPs are mapped to cloud provider ASNs via MaxMind GeoLite2 — the same offline pipeline used for Solana and Ethereum.</li>
                                            <li><strong className="text-white">Uptime:</strong> <code className="text-xs bg-white/10 px-1 rounded">observedUptime</code> is reported by the queried node for each peer — it measures the fraction of time the peer has been reachable.</li>
                                        </ol>
                                        <p className="pt-4 border-t border-white/10 text-xs text-slate-500 font-mono italic">
                                            Dataset: Live peer snapshot. Refreshed every 2 hours.
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

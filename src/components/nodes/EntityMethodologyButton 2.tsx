'use client';

import { useState, useEffect } from 'react';
import { BuildingOffice2Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export default function EntityMethodologyButton() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <>
            {/* Trigger — sits above the Data Methodology button (bottom-20) */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-6 z-40 group flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl bg-white/5 border border-white/10 hover:border-[var(--chain-accent)]/50"
            >
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-[var(--chain-accent)]" />
                <BuildingOffice2Icon aria-hidden="true" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity text-[var(--chain-accent)]" />
                <span className="text-xs font-bold uppercase tracking-widest transition-colors text-white/70 group-hover:text-white">
                    Entity Methodology
                </span>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-[#000E1E]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-[#050510] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-[0_0_40px_color-mix(in_srgb,var(--chain-accent)_10%,transparent)]"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--chain-accent)]" />

                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <BuildingOffice2Icon aria-hidden="true" className="w-5 h-5 text-[var(--chain-accent)]" />
                                    Entity Methodology
                                </h3>
                                <button
                                    aria-label="Close"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 text-sm leading-relaxed text-slate-300 space-y-4">
                                <p>
                                    Each validator is identified by its <strong className="text-white">identity public key</strong>. We cross-reference three independent registries to resolve the organization behind that key:
                                </p>
                                <ol className="list-decimal list-outside ml-4 space-y-3">
                                    <li>
                                        <strong className="text-white">Marinade Finance Registry</strong>{' '}
                                        <span className="text-xs text-[var(--chain-accent)] font-mono">#1 priority</span>
                                        <br />
                                        788 validators tracked, 635 named. Includes major institutional operators (Alchemy, Jupiter, Binance, Galaxy, Kraken…).
                                    </li>
                                    <li>
                                        <strong className="text-white">Solana On-Chain Config Program</strong>{' '}
                                        <span className="text-xs text-[var(--chain-accent)] font-mono">#2 priority</span>
                                        <br />
                                        Validators who published their info on-chain via <code className="text-xs bg-white/10 px-1 rounded">solana validator-info publish</code>. ~2,480 entries.
                                    </li>
                                    <li>
                                        <strong className="text-white">StakeWiz</strong>{' '}
                                        <span className="text-xs text-white/30 font-mono">fallback</span>
                                        <br />
                                        Community-maintained registry, used as last resort for validators absent from the two sources above.
                                    </li>
                                </ol>
                                <p className="pt-4 border-t border-white/10 text-xs text-slate-500 font-mono italic">
                                    Validators absent from all registries are shown as "Unknown Validator" — they have not published their identity anywhere publicly.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

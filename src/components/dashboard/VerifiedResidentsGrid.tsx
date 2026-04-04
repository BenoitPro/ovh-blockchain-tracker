'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, SignalIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { CHAINS, ChainId } from '@/lib/chains';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';

interface VerifiedValidator {
    name: string;
    address: string;
    weightFormatted: string;
    image?: string;
    provider: string;
    rank: number;
}

interface VerifiedResidentsGridProps {
    chainId: ChainId;
    limit?: number;
}

export default function VerifiedResidentsGrid({ chainId, limit = 6 }: VerifiedResidentsGridProps) {
    const [validators, setValidators] = useState<VerifiedValidator[]>([]);
    const [loading, setLoading] = useState(true);
    const { theme } = useNetworkTheme();
    const currentChain = CHAINS[theme] || CHAINS.solana;
    const accent = currentChain.accent;

    useEffect(() => {
        async function fetchVerified() {
            setLoading(true);
            try {
                const response = await fetch(`/api/validators/verified-ovh?chain=${chainId}&limit=${limit}`);
                const result = await response.json();
                if (result.success && result.data) {
                    setValidators(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch verified residents:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchVerified();
    }, [chainId, limit]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(limit)].map((_, i) => (
                    <div key={i} className="glass-card p-6 h-48 animate-pulse bg-white/5 border-white/10" />
                ))}
            </div>
        );
    }

    if (validators.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validators.map((v, i) => (
                <motion.div
                    key={v.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card group relative overflow-hidden p-6 hover:border-[var(--chain-accent)]/40 transition-all duration-500"
                >
                    {/* Monitoring Indicator */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 translate-x-1 translate-y-[-1px]">
                         <span className="relative flex h-2 w-2">
                             <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`} style={{ backgroundColor: accent }}></span>
                             <span className={`relative inline-flex rounded-full h-2 w-2`} style={{ backgroundColor: accent }}></span>
                         </span>
                         <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 transition-colors">Monitoring Active</span>
                    </div>

                    <div className="flex flex-col h-full">
                        {/* Header: Logo / Avatar + Name */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative shrink-0">
                                {v.image ? (
                                    <img src={v.image} alt={v.name} className="w-12 h-12 rounded-xl object-contain border border-white/10 bg-white/5 p-1" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-white/40 text-lg group-hover:from-[var(--chain-accent)]/20 transition-all">
                                        {v.name.substring(0, 1)}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#050510] border border-white/10 flex items-center justify-center shadow-lg">
                                    <ShieldCheckIcon className="w-3 h-3" style={{ color: accent }} />
                                </div>
                            </div>
                            
                            <div className="min-w-0">
                                <h4 className="text-base font-black text-white truncate drop-shadow-sm group-hover:text-[var(--chain-accent)] transition-colors">{v.name}</h4>
                                <p className="text-[9px] font-mono text-white/40 truncate">{v.address.replace(/(.{8}).+(.{8})/, '$1...$2')}</p>
                            </div>
                        </div>

                        {/* Network Impact Info */}
                        <div className="mt-auto pt-4 border-t border-white/5 flex items-end justify-between">
                            <div className="space-y-1">
                                <p className="text-[8px] font-bold uppercase tracking-widest text-white/20">Consensus Stake</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-white/90">{v.weightFormatted}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                                 <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 flex items-center gap-1.5 group-hover:border-[var(--chain-accent)]/20 transition-colors">
                                     <MapPinIcon className="w-3 h-3 text-white/40 group-hover:text-[var(--chain-accent)] transition-colors" />
                                     <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">OVHcloud Resident</span>
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* Subtle hover background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-1000 pointer-events-none"
                         style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }} />
                </motion.div>
            ))}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/dashboard/Header';
import ParticlesBackground from '@/components/ParticlesBackground';
import OVHServerSpecs from '@/components/dashboard/OVHServerSpecs';
import type { ChainId } from '@/lib/chains';

export interface GuideItem {
    id: string;
    icon: 'info' | 'server' | 'deploy' | 'partners';
    question: string;
    answer: string;
    link?: string;
    isExternal?: boolean;
}

interface Props {
    chainId: ChainId;
    accent: string;
    networkName: string;
    description: string;
    items: GuideItem[];
}

function GuideIcon({ type, className }: { type: GuideItem['icon']; className?: string }) {
    switch (type) {
        case 'info':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                </svg>
            );
        case 'server':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
            );
        case 'deploy':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        case 'partners':
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
            );
    }
}

export default function GuidePageLayout({ chainId, accent, networkName, description, items }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="relative min-h-screen">
            <ParticlesBackground />
            <main className="relative z-10 p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
                <Header network={networkName} subtitle="Node Setup Guide" />

                <p className="text-white/50 text-sm max-w-2xl mb-12 leading-relaxed">
                    {description}
                </p>

                {/* Guide Items */}
                <div className="grid grid-cols-1 gap-3 mb-16 max-w-4xl">
                    {items.map((item, index) => {
                        const isExpanded = expandedId === item.id;
                        const isLinkCard = item.isExternal && !!item.link;

                        const cardContent = (
                            <div className="flex items-center gap-5 px-6 py-5 w-full text-left">
                                <div
                                    className="p-3 rounded-xl shrink-0 transition-colors duration-200"
                                    style={{
                                        background: isExpanded || isLinkCard ? `${accent}20` : 'rgba(255,255,255,0.06)',
                                        color: isExpanded || isLinkCard ? accent : 'rgba(255,255,255,0.35)',
                                    }}
                                >
                                    <GuideIcon type={item.icon} className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-sm font-bold transition-colors duration-200 ${isExpanded || isLinkCard ? 'text-white' : 'text-white/70'}`}>
                                        {item.question}
                                    </h3>
                                    {isLinkCard && (
                                        <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: accent }}>
                                            External Resource
                                        </p>
                                    )}
                                </div>
                                <div className="shrink-0">
                                    {isLinkCard ? (
                                        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    ) : (
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24"
                                            stroke={isExpanded ? accent : 'rgba(255,255,255,0.3)'}
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        );

                        if (isLinkCard) {
                            return (
                                <motion.a
                                    key={item.id}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                    className="group rounded-2xl border transition-all duration-200 hover:opacity-90"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        borderColor: `${accent}35`,
                                    }}
                                >
                                    {cardContent}
                                </motion.a>
                            );
                        }

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.4 }}
                                className="rounded-2xl border overflow-hidden transition-all duration-200"
                                style={{
                                    background: isExpanded ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                                    borderColor: isExpanded ? `${accent}40` : 'rgba(255,255,255,0.08)',
                                }}
                            >
                                <button
                                    className="w-full"
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                >
                                    {cardContent}
                                </button>

                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <div className="px-6 pb-6 pt-0 pl-20">
                                                <div className="h-px bg-white/8 mb-5" />
                                                <p className="text-white/60 text-sm leading-relaxed">
                                                    {item.answer}
                                                </p>
                                                {item.link && !item.isExternal && (
                                                    <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:opacity-80"
                                                        style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}40` }}
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        View official documentation
                                                    </a>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Recommended OVH Infrastructure */}
                <OVHServerSpecs chainId={chainId} accent={accent} />
            </main>
        </div>
    );
}

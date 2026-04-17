'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface AnimatedTaglineProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    text?: string;
    /** When provided, "OVHcloud" in the title becomes a clickable toggle */
    viewMode?: 'ovh' | 'global';
    onViewModeChange?: (mode: 'ovh' | 'global') => void;
    accentColor?: string;
}

/** Click-cursor SVG hint — stays visible, loops a "click" animation */
function ClickHint({ color }: { color: string }) {
    return (
        <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
            className="absolute -bottom-2 left-[60%] pointer-events-none"
        >
            <motion.svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="drop-shadow-lg"
                animate={{ scale: [1, 0.82, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8, ease: 'easeInOut' }}
            >
                <path d="M7 2l0 13.5 3.5-3.5 2.5 6 2.5-1-2.5-6H18L7 2z" fill={color} stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinejoin="round"/>
            </motion.svg>
        </motion.span>
    );
}

export default function AnimatedTagline({ title, subtitle, text, viewMode, onViewModeChange, accentColor }: AnimatedTaglineProps) {
    const displayTitle = text || title;
    const hasToggle = viewMode !== undefined && onViewModeChange !== undefined;
    const isOvhActive = viewMode === 'ovh';
    const [hasInteracted, setHasInteracted] = useState(false);

    const handleClick = () => {
        if (!onViewModeChange) return;
        setHasInteracted(true);
        onViewModeChange(isOvhActive ? 'global' : 'ovh');
    };

    // Shared strikethrough style for inactive state
    const inactiveStyle = {
        color: accentColor || 'var(--chain-accent)',
        textShadow: 'none',
        textDecoration: 'line-through' as const,
        textDecorationColor: 'rgba(255,255,255,0.4)',
        opacity: 0.35,
    };

    const activeStyle = {
        color: accentColor || 'var(--chain-accent)',
        textShadow: accentColor
            ? `0 0 20px ${accentColor}80, 0 0 40px ${accentColor}40`
            : '0 0 20px color-mix(in srgb, var(--chain-accent) 50%, transparent), 0 0 40px color-mix(in srgb, var(--chain-accent) 25%, transparent)',
        textDecoration: 'none' as const,
        opacity: 1,
    };

    return (
        <div className="flex flex-col items-center justify-center text-center mt-1 mb-1 relative z-20 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className="relative"
            >
                <div
                    className="absolute -inset-4 opacity-30 blur-2xl rounded-full"
                    style={{ background: `radial-gradient(circle, var(--chain-accent) 0%, transparent 70%)` }}
                />
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black px-4 tracking-tight leading-tight relative z-10 text-white drop-shadow-[0_0_15px_color-mix(in_srgb,var(--chain-accent)_30%,transparent)]">
                    {displayTitle}
                    {hasToggle && (
                        <>
                            {' '}
                            <motion.span
                                onClick={handleClick}
                                className="pointer-events-auto cursor-pointer select-none relative inline-block overflow-visible"
                                animate={!isOvhActive && !hasInteracted ? {
                                    opacity: [0.35, 0.55, 0.35],
                                } : undefined}
                                transition={!isOvhActive && !hasInteracted ? {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                } : undefined}
                                whileHover={{
                                    opacity: 1,
                                    scale: 1.05,
                                }}
                                style={isOvhActive ? activeStyle : inactiveStyle}
                            >
                                on OVHcloud
                                {/* Click hint cursor — stays until user interacts */}
                                <AnimatePresence>
                                    {!hasInteracted && !isOvhActive && (
                                        <ClickHint color={accentColor || '#00F0FF'} />
                                    )}
                                </AnimatePresence>
                            </motion.span>
                        </>
                    )}
                </h2>
            </motion.div>

            {subtitle && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="text-[10px] md:text-xs mt-1 font-medium uppercase tracking-[0.2em] text-white/60"
                    style={{ textShadow: `0 0 10px color-mix(in srgb, var(--chain-accent) 25%, transparent)` }}
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
    );
}

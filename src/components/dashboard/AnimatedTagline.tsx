'use client';

import { motion } from 'framer-motion';

interface AnimatedTaglineProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    text?: string;
}

export default function AnimatedTagline({ title, subtitle, text }: AnimatedTaglineProps) {
    // If text is provided, we can just split it if needed, or simply render it as the title.
    // Assuming text might be a simpler one-liner.
    const displayTitle = text || title;

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

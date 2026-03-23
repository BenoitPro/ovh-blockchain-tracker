'use client';

import { motion } from 'framer-motion';

interface AnimatedTaglineProps {
    title: React.ReactNode;
    subtitle: React.ReactNode;
    accentColor?: string;
}

export default function AnimatedTagline({ title, subtitle, accentColor = '#00F0FF' }: AnimatedTaglineProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center mt-2 mb-2 relative z-20 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className="relative"
            >
                <div 
                    className="absolute -inset-4 opacity-30 blur-2xl rounded-full"
                    style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
                />
                <h2 className="text-3xl md:text-5xl font-black text-white px-4 tracking-tight leading-tight relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {title}
                </h2>
            </motion.div>
            
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="text-white/60 text-sm md:text-md mt-4 font-medium uppercase tracking-[0.2em]"
                style={{ textShadow: `0 0 10px ${accentColor}40` }}
            >
                {subtitle}
            </motion.p>
        </div>
    );
}

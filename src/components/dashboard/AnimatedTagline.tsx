'use client';

import { motion } from 'framer-motion';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';

interface AnimatedTaglineProps {
    title: React.ReactNode;
    subtitle: React.ReactNode;
    accentColor?: string;
}

export default function AnimatedTagline({ title, subtitle, accentColor = '#00F0FF' }: AnimatedTaglineProps) {
    const { theme } = useNetworkTheme();
    const isEth = theme === 'ethereum';

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
                    style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
                />
                <h2 className={`text-2xl md:text-3xl lg:text-4xl font-black px-4 tracking-tight leading-tight relative z-10 ${isEth ? 'text-slate-800 drop-shadow-none' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'}`}>
                    {title}
                </h2>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className={`text-[10px] md:text-xs mt-1 font-medium uppercase tracking-[0.2em] ${isEth ? 'text-slate-500' : 'text-white/60'}`}
                style={{ textShadow: isEth ? 'none' : `0 0 10px ${accentColor}40` }}
            >
                {subtitle}
            </motion.p>
        </div>
    );
}

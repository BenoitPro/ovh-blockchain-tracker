import { useState } from 'react';
import { ServerIcon, ChartPieIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatPercentage } from '@/lib/solana/calculateMetrics';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import { CHAINS, ChainId } from '@/lib/chains';

interface KPICardsProps {
    totalNodes: number;
    ovhNodes: number;
    marketShare: number;
    vertical?: boolean;
    align?: 'left' | 'center' | 'right';
}

export default function KPICards({ 
    totalNodes, 
    ovhNodes, 
    marketShare, 
    vertical = false,
    align = 'center'
}: KPICardsProps) {
    const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
    const { theme } = useNetworkTheme();
    const currentChainName = CHAINS[theme as ChainId]?.name || 'Network';

    const metrics = [
        {
            title: `Total ${currentChainName} Nodes`,
            value: totalNodes.toLocaleString(),
            icon: ServerIcon,
            color: 'var(--chain-accent)',
            tooltipTitle: `Total ${currentChainName} Nodes`,
            tooltipContent: `Total number of discovered nodes across the entire ${currentChainName} network during the last crawl.`
        },
        {
            title: 'Active OVHcloud Nodes',
            value: ovhNodes.toString(),
            icon: ServerIcon,
            color: 'var(--chain-accent)',
            tooltipTitle: 'Active OVHcloud Nodes',
            tooltipContent: `Number of ${currentChainName} network nodes currently identifying as hosting on OVHcloud infrastructure.`
        },
        {
            title: 'Market Share (All Nodes)',
            value: formatPercentage(marketShare),
            icon: ChartPieIcon,
            color: 'var(--chain-accent)',
            tooltipTitle: 'Node Market Share',
            tooltipContent: `Percentage of total ${currentChainName} nodes hosted on OVHcloud infrastructure.`
        }
    ];

    const alignmentClasses = {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right'
    };

    const containerAlignment = {
        left: 'items-start',
        center: 'items-center',
        right: 'items-end'
    };

    return (
        <div className={`flex ${vertical ? `flex-col ${containerAlignment[align]} gap-1 md:gap-2` : 'flex-wrap md:flex-nowrap gap-4 md:gap-8 justify-center items-stretch'} w-full relative z-20 px-2 lg:px-0`}>
            {metrics.map((item, index: number) => (
                <div
                    key={index}
                    onClick={() => setActiveTooltip(index)}
                    className={`relative group cursor-pointer flex flex-col ${vertical ? alignmentClasses[align] : 'items-center text-center'} p-1.5 md:p-2 flex-1 min-w-[180px] max-w-[300px] transition-all`}
                >
                    {/* Glowing effect behind the text */}
                    <div 
                        className={`absolute inset-0 opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-700 pointer-events-none ${vertical && align === 'right' ? 'translate-x-1/2' : (vertical && align === 'left' ? '-translate-x-1/2' : 'rounded-full')}`}
                        style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 60%)` }}
                    />
                    
                    <div className={`flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 text-slate-400 group-hover:text-white transition-colors duration-300 ${vertical && align === 'right' ? 'flex-row-reverse' : ''}`}>
                        <item.icon className="w-4 h-4 md:w-5 md:h-5 opacity-70" style={{ color: item.color }} />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] shrink-0 text-center">{item.title}</span>
                        <InformationCircleIcon className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-30 hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <h3 
                        className="text-xl sm:text-2xl md:text-3xl font-black drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-105"
                        style={{ color: item.color, textShadow: `0 0 30px color-mix(in srgb, ${item.color} 60%, transparent)` }}
                    >
                        {item.value}
                    </h3>

                    {/* Tooltip Overlay */}
                    <AnimatePresence>
                        {activeTooltip === index && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className={`absolute bottom-full ${vertical ? 'right-0' : ''} mb-4 z-50 w-72 bg-[#050510]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl text-left cursor-default`}
                                style={{ boxShadow: `0 10px 40px color-mix(in srgb, ${item.color} 20%, transparent)` }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button 
                                    className="absolute top-3 right-3 text-white/50 hover:text-white"
                                    onClick={(e) => { e.stopPropagation(); setActiveTooltip(null); }}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                                <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: item.color }}>
                                    <InformationCircleIcon className="w-4 h-4" />
                                    {item.tooltipTitle}
                                </h4>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {item.tooltipContent}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}

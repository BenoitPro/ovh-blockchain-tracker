import { useState } from 'react';
import { ServerIcon, ChartPieIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatPercentage } from '@/lib/solana/calculateMetrics';
import { motion, AnimatePresence } from 'framer-motion';

interface KPICardsProps {
    totalNodes: number;
    ovhNodes: number;
    marketShare: number;
}

export default function KPICards({ totalNodes, ovhNodes, marketShare }: KPICardsProps) {
    const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

    const metrics = [
        {
            title: 'Total Network Nodes',
            value: totalNodes.toLocaleString(),
            icon: ServerIcon,
            color: '#A855F7',
            tooltipTitle: 'Total Network Nodes',
            tooltipContent: 'Total number of active nodes detected globally on the network.'
        },
        {
            title: 'Active OVH Nodes (RPC + Staking)',
            value: ovhNodes.toString(),
            icon: ServerIcon,
            color: '#00F0FF',
            tooltipTitle: 'Active OVH Nodes (RPC + Staking)',
            tooltipContent: 'Total number of Solana network nodes (both RPC and voting validators) currently identifying as hosting on OVHcloud infrastructure via their ASN.'
        },
        {
            title: 'Market Share (All Nodes)',
            value: formatPercentage(marketShare),
            icon: ChartPieIcon,
            color: '#6B4FBB',
            tooltipTitle: 'Node Market Share',
            tooltipContent: 'Percentage of total network nodes (RPC + Staking) hosted on OVH.'
        }
    ];

    return (
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center w-full relative z-20">
            {metrics.map((item, index) => (
                <div
                    key={index}
                    onClick={() => setActiveTooltip(index)}
                    className="relative group cursor-pointer flex flex-col items-center text-center p-4 min-w-[300px]"
                >
                    {/* Glowing effect behind the text */}
                    <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-700 pointer-events-none rounded-full"
                        style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 60%)` }}
                    />
                    
                    <div className="flex items-center gap-2 mb-2 text-slate-400 group-hover:text-white transition-colors duration-300">
                        <item.icon className="w-5 h-5 opacity-70" style={{ color: item.color }} />
                        <span className="text-xs font-bold uppercase tracking-[0.15em]">{item.title}</span>
                        <InformationCircleIcon className="w-4 h-4 opacity-30 hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <h3 
                        className="text-4xl md:text-5xl font-black drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-105"
                        style={{ color: item.color, textShadow: `0 0 30px ${item.color}60` }}
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
                                className="absolute bottom-full mb-4 z-50 w-72 bg-[#050510]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl text-left cursor-default"
                                style={{ boxShadow: `0 10px 40px ${item.color}20` }}
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

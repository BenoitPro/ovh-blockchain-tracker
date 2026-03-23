import { useState } from 'react';
import { ServerIcon, ChartPieIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatPercentage } from '@/lib/solana/calculateMetrics';
import { motion, AnimatePresence } from 'framer-motion';

interface KPICardsProps {
    totalNodes: number;
    ovhNodes: number;
    marketShare: number;
    network?: 'solana' | 'ethereum';
}

export default function KPICards({ totalNodes, ovhNodes, marketShare, network = 'solana' }: KPICardsProps) {
    const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
    const isEth = network === 'ethereum';

    const metrics = [
        {
            title: isEth ? 'Total Execution Nodes' : 'Total Network Nodes',
            value: totalNodes.toLocaleString(),
            icon: ServerIcon,
            color: '#A855F7',
            tooltipTitle: isEth ? 'Total Execution Nodes' : 'Total Network Nodes',
            tooltipContent: isEth
                ? 'Total number of discovered execution-layer nodes across the entire Ethereum network during the last crawl.'
                : 'Total number of active nodes detected globally on the network.'
        },
        {
            title: isEth ? 'Active OVH Nodes' : 'Active OVH Nodes (RPC + Staking)',
            value: ovhNodes.toString(),
            icon: ServerIcon,
            color: '#00F0FF',
            tooltipTitle: isEth ? 'Active OVH Nodes' : 'Active OVH Nodes (RPC + Staking)',
            tooltipContent: isEth
                ? 'Number of Ethereum execution-layer nodes mapped to OVHcloud ASNs via MaxMind GeoLite2.'
                : 'Total number of Solana network nodes (both RPC and voting validators) currently identifying as hosting on OVHcloud infrastructure via their ASN.'
        },
        {
            title: 'Market Share (All Nodes)',
            value: formatPercentage(marketShare),
            icon: ChartPieIcon,
            color: '#6B4FBB',
            tooltipTitle: 'Node Market Share',
            tooltipContent: isEth
                ? 'Percentage of total Ethereum execution-layer nodes hosted on OVHcloud infrastructure.'
                : 'Percentage of total network nodes (RPC + Staking) hosted on OVH.'
        }
    ];

    return (
        <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-8 justify-center items-stretch w-full relative z-20 px-2 lg:px-0">
            {metrics.map((item, index) => (
                <div
                    key={index}
                    onClick={() => setActiveTooltip(index)}
                    className="relative group cursor-pointer flex flex-col items-center text-center p-3 md:p-4 flex-1 min-w-[200px] max-w-[350px]"
                >
                    {/* Glowing effect behind the text */}
                    <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-700 pointer-events-none rounded-full"
                        style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 60%)` }}
                    />
                    
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 text-slate-400 group-hover:text-white transition-colors duration-300">
                        <item.icon className="w-4 h-4 md:w-5 md:h-5 opacity-70" style={{ color: item.color }} />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] shrink-0 text-center">{item.title}</span>
                        <InformationCircleIcon className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-30 hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <h3 
                        className="text-2xl sm:text-3xl md:text-4xl font-black drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-105"
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

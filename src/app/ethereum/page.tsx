'use client';

import { useEffect, useState, useCallback } from 'react';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import WorldMap from '@/components/dashboard/WorldMap';
import Footer from '@/components/dashboard/Footer';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import { EthSnapshotMetrics } from '@/types';
import { ServerIcon, ChartPieIcon, ClockIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ParticlesBackground from '@/components/ParticlesBackground';
import BlockchainCubes from '@/components/BlockchainCubes';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import MethodologyModal from '@/components/dashboard/MethodologyModal';
import { motion, AnimatePresence } from 'framer-motion';

const ETH_COLOR = '#627EEA';

function useScrollReveal(ready: boolean) {
    const observe = useCallback(() => {
        if (!ready) return () => { };
        const timeoutId = setTimeout(() => {
            const elements = document.querySelectorAll('.fade-in-up');
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.12 }
            );
            elements.forEach((el) => observer.observe(el));
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [ready]);

    useEffect(() => {
        const cleanup = observe();
        return cleanup;
    }, [observe]);
}

function formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function EthereumPage() {
    const [metrics, setMetrics] = useState<EthSnapshotMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

    useScrollReveal(!loading && !!metrics);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/ethereum');
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch data');
            setMetrics(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) {
        return (
            <>
                <BlockchainCubes opacity={0.15} />
                <ParticlesBackground />
                <LoadingState />
            </>
        );
    }

    if (error || !metrics) {
        return (
            <>
                <BlockchainCubes opacity={0.15} />
                <ParticlesBackground />
                <ErrorState message={error || 'No data available'} onRetry={fetchData} />
            </>
        );
    }

    const ovhCount = metrics.providerDistribution['ovh'] || 0;
    const ovhShare = metrics.totalNodes > 0 ? (ovhCount / metrics.totalNodes) * 100 : 0;

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto bg-[#050510]" style={{ backgroundImage: "url('https://unpkg.com/three-globe/example/img/night-sky.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            {/* Animated Backgrounds */}
            <BlockchainCubes opacity={0.15} />
            <ParticlesBackground />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col min-h-screen">

                <main className="flex-1 flex flex-col p-6 w-full max-w-7xl mx-auto">
                    
                    {/* Animated Tagline */}
                    <AnimatedTagline 
                        title={
                            <>Distribution of Ethereum Nodes on <span style={{ color: '#627EEA', textShadow: '0 0 20px #627EEA80' }}>OVHcloud</span></>
                        }
                        subtitle="Empowering the decentralized network"
                        accentColor="#627EEA"
                    />

                    {/* 1. World Map */}
                    {Object.keys(metrics.geoDistribution).length > 0 && (
                        <section className="mb-2 fade-in-up relative z-10 w-full">
                            <div className="w-full flex items-center justify-center">
                                <WorldMap geoDistribution={metrics.geoDistribution} />
                            </div>
                        </section>
                    )}

                    {/* 2. KPI HUD style elements (Moved back down) */}
                    <section className="mt-0 mb-4 fade-in-up delay-100 flex-shrink-0 relative z-20">
                        <div className="flex flex-col md:flex-row gap-8 justify-center items-center w-full">
                            {[
                                {
                                    title: 'Total Execution Nodes',
                                    value: metrics.totalNodes.toLocaleString(),
                                    icon: ServerIcon,
                                    color: '#627EEA',
                                    tooltipTitle: 'Total Execution Nodes',
                                    tooltipContent: 'Total number of discovered execution-layer nodes across the entire network during the last successful crawl.'
                                },
                                {
                                    title: 'OVHcloud Nodes',
                                    value: ovhCount.toLocaleString(),
                                    icon: ChartPieIcon,
                                    color: '#00F0FF',
                                    tooltipTitle: 'OVHcloud Nodes',
                                    tooltipContent: 'Number of nodes accurately mapped to OVHcloud ASNs via MaxMind GeoLite2.'
                                },
                                {
                                    title: 'Market Share',
                                    value: `${ovhShare.toFixed(2)}%`,
                                    icon: ClockIcon,
                                    color: '#6B4FBB',
                                    tooltipTitle: 'Market Share Info',
                                    tooltipContent: `Snapshot captured on ${formatTimestamp(metrics.timestamp)}. ${metrics.crawlDurationMin ? `${metrics.crawlDurationMin} min crawl.` : ''}`
                                }
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => setActiveTooltip(index)}
                                    className="relative group cursor-pointer flex flex-col items-center text-center p-4 min-w-[280px]"
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
                    </section>

                    {/* 3. Provider Comparison */}
                    <section className="mb-12 fade-in-up delay-200">
                        <div className="rounded-2xl overflow-hidden shadow-xl"
                            style={{ boxShadow: '0 8px 40px rgba(98,126,234,0.10), 0 2px 12px rgba(98,126,234,0.06)' }}>
                            <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                        </div>
                    </section>

                </main>
                
                {/* Methodology Modal */}
                <MethodologyModal network="ethereum" accentColor="#627EEA" />
            </div>
        </div>
    );
}

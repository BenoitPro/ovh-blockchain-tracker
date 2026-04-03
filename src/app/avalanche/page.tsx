'use client';

import { useEffect, useState } from 'react';
import WorldMap from '@/components/dashboard/WorldMap';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import MethodologyModal from '@/components/dashboard/MethodologyModal';
import ParticlesBackground from '@/components/ParticlesBackground';
import BlockchainCubes from '@/components/BlockchainCubes';
import { AvalancheDashboardMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const AVAX_RED = '#E84142';

/** Uptime gauge widget — Avalanche-specific KPI */
function UptimeGauge({ value, label }: { value: number; label: string }) {
    const pct = Math.min(100, Math.max(0, value));
    const isGood = pct >= 80;
    const color = isGood ? AVAX_RED : '#F59E0B';
    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                    background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                    boxShadow: `0 0 18px ${color}30`,
                }}
            >
                <div className="w-14 h-14 rounded-full bg-[#0a0404] flex items-center justify-center">
                    <span className="text-sm font-black text-white">{pct.toFixed(0)}%</span>
                </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/50">{label}</span>
        </div>
    );
}

export default function AvalanchePage() {
    const [metrics, setMetrics] = useState<AvalancheDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useScrollReveal(!loading && !!metrics);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/avalanche');
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

    const bgStyle = {
        background: '#0a0404',
        backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(232,65,66,0.09) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(180,30,30,0.07) 0%, transparent 50%)
        `,
        backgroundAttachment: 'fixed' as const,
    };

    if (loading) {
        return (
            <div className="min-h-screen relative" style={bgStyle}>
                <BlockchainCubes opacity={0.07} network="avalanche" count={10} />
                <ParticlesBackground network="avalanche" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <LoadingState />
                </div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <>
                <BlockchainCubes opacity={0.07} network="avalanche" count={10} />
                <ParticlesBackground network="avalanche" />
                <div style={bgStyle} className="min-h-screen relative">
                    <ErrorState message={error || 'No data available'} onRetry={fetchData} />
                </div>
            </>
        );
    }

    const ovhCount = metrics.ovhNodes;
    const hasUptimeData = metrics.avgOVHUptime !== undefined && metrics.pctOVHUptimeAbove80 !== undefined;
    const showAvgUptime = hasUptimeData && metrics.avgOVHUptime! > 0;
    const showPctUptime = hasUptimeData && metrics.pctOVHUptimeAbove80! > 0;

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={bgStyle}>
            {/* Subtle red particles */}
            <BlockchainCubes opacity={0.07} network="avalanche" count={10} />
            <ParticlesBackground network="avalanche" />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 flex flex-col p-2 md:p-4 w-full max-w-7xl mx-auto">

                    <AnimatedTagline
                        title={
                            <>Distribution of Avalanche Nodes on <span style={{ color: AVAX_RED, textShadow: `0 0 20px ${AVAX_RED}80` }}>OVHcloud</span></>
                        }
                        subtitle="Tracking validators on the fastest smart contracts platform"
                        accentColor={AVAX_RED}
                    />

                    {/* ── Avalanche-specific uptime KPIs ──────────────────────── */}
                    <div className="fade-in-up flex justify-center gap-10 mb-6 pt-2">
                        {showAvgUptime && (
                            <UptimeGauge
                                value={metrics.avgOVHUptime!}
                                label="Avg OVH Uptime"
                            />
                        )}
                        {showPctUptime && (
                            <UptimeGauge
                                value={metrics.pctOVHUptimeAbove80!}
                                label="Uptime ≥ 80%"
                            />
                        )}
                        {/* Sample size reminder */}
                        <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-2xl font-black text-white">{metrics.totalNodes}</span>
                            <span className="text-[10px] uppercase tracking-widest text-white/40">Peers sampled</span>
                            <span className="text-[9px] text-white/25 italic">single-node snapshot</span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                        {/* World Map */}
                        {Object.keys(metrics.geoDistribution).length > 0 && (
                            <section className="flex-1 flex flex-col fade-in-up relative z-10 w-full h-[600px] md:h-[700px]">
                                <div className="w-full h-full flex items-center justify-center">
                                    <WorldMap
                                        geoDistribution={metrics.geoDistribution}
                                        globalGeoDistribution={metrics.globalGeoDistribution}
                                        totalNodes={metrics.totalNodes}
                                        ovhNodes={ovhCount}
                                        marketShare={metrics.marketShare}
                                    />
                                </div>
                            </section>
                        )}
                    </div>
                </main>

                {/* Data Methodology Modal — Avalanche-specific content */}
                <MethodologyModal network="avalanche" accentColor={AVAX_RED} />
            </div>
        </div>
    );
}

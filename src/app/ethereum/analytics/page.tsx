'use client';

import { useEffect, useState } from 'react';

import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import KPICards from '@/components/dashboard/KPICards';
import { EthSnapshotMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { GlobeEuropeAfricaIcon } from '@heroicons/react/24/outline';
import ParticlesBackground from '@/components/ParticlesBackground';
import BlockchainCubes from '@/components/BlockchainCubes';

function formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    }) + ' UTC';
}

function GeoDistribution({ geoDistribution }: { geoDistribution: Record<string, number> }) {
    const total = Object.values(geoDistribution).reduce((s, v) => s + v, 0);
    const top = Object.entries(geoDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const maxVal = top[0]?.[1] ?? 1;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-[#627EEA]/15 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Geographic Distribution</h2>
                    <p className="text-sm text-slate-500 mt-1">Top 10 countries hosting Ethereum nodes</p>
                </div>
                <GlobeEuropeAfricaIcon className="w-6 h-6 text-[#627EEA]/60" />
            </div>
            <div className="space-y-3">
                {top.map(([country, count]) => {
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    const barWidth = (count / maxVal) * 100;
                    return (
                        <div key={country} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-700 font-medium">{country}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400">{count.toLocaleString()} nodes</span>
                                    <span className="text-xs font-semibold text-[#627EEA] w-12 text-right">{pct.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#627EEA]/70 to-[#627EEA]/30 transition-all duration-500"
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}



export default function EthereumAnalyticsPage() {
    const [metrics, setMetrics] = useState<EthSnapshotMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <div className="min-h-screen relative">
                <BlockchainCubes opacity={0.03} network="ethereum" />
                <ParticlesBackground network="ethereum" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <LoadingState network="ethereum" />
                </div>

            </div>
        );
    }


    if (error || !metrics) {
        return (
            <>
                <BlockchainCubes opacity={0.03} network="ethereum" />
                <ParticlesBackground network="ethereum" />
                <ErrorState message={error || 'No data available'} onRetry={fetchData} />
            </>
        );
    }

    const ovhEntry = metrics.providerBreakdown.find(p => p.key === 'ovh');
    const ovhNodes = ovhEntry?.nodeCount ?? 0;
    const ovhMarketShare = ovhEntry?.marketShare ?? 0;

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto">
            {/* Animated Blockchain Cubes Background (Subtle for Eth) */}
            <BlockchainCubes opacity={0.03} network="ethereum" />

            {/* Floating Starry Points Background */}
            <ParticlesBackground network="ethereum" />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 container mx-auto px-6 py-10 md:py-12 max-w-[1400px]">

                    {/* Page header */}
                    <div className="mb-8 fade-in-up">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
                                    Ethereum Analytics
                                </h1>
                                <p className="text-slate-500 text-sm">
                                    Cloud provider distribution across the Ethereum execution-layer network.
                                </p>
                            </div>
                            {metrics.timestamp && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-slate-200 text-xs text-slate-400 self-start mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Updated: {formatTimestamp(metrics.timestamp)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <section className="mb-10 fade-in-up">
                        <KPICards
                            totalNodes={metrics.totalNodes}
                            ovhNodes={ovhNodes}
                            marketShare={ovhMarketShare}
                            network="ethereum"
                        />
                    </section>

                    {/* Provider Comparison Chart */}
                    <section className="mb-8 fade-in-up delay-100">
                        <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                    </section>

                    {/* Bottom grid: Geo + Insights */}
                    <div className="fade-in-up delay-200">
                        {Object.keys(metrics.geoDistribution).length > 0 && (
                            <GeoDistribution geoDistribution={metrics.geoDistribution} />
                        )}
                    </div>

                </main>

            </div>
        </div>
    );
}

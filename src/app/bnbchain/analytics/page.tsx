'use client';

import { useEffect, useState } from 'react';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import KPICards from '@/components/dashboard/KPICards';
import { BNBChainDashboardMetrics } from '@/types/bnbchain';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { GlobeEuropeAfricaIcon } from '@heroicons/react/24/outline';
import ParticlesBackground from '@/components/ParticlesBackground';

const BNB_GOLD = '#F3BA2F';

function formatTimestamp(ts: number): string {
    return (
        new Date(ts).toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
        }) + ' UTC'
    );
}

function GeoDistribution({ geoDistribution }: { geoDistribution: Record<string, number> }) {
    const total = Object.values(geoDistribution).reduce((s, v) => s + v, 0);
    const top = Object.entries(geoDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const maxVal = top[0]?.[1] ?? 1;

    return (
        <div
            className="relative overflow-hidden rounded-2xl border p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            style={{
                background: 'linear-gradient(135deg, rgba(243, 186, 47, 0.04) 0%, rgba(10, 8, 0, 1) 100%)',
                borderColor: 'rgba(243, 186, 47, 0.12)',
            }}
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Geographic Distribution</h2>
                    <p className="text-sm text-gray-400 mt-1">Top 10 countries hosting BNB Chain nodes</p>
                </div>
                <GlobeEuropeAfricaIcon className="w-6 h-6" style={{ color: `${BNB_GOLD}99` }} />
            </div>
            <div className="space-y-3">
                {top.map(([country, count]) => {
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    const barWidth = (count / maxVal) * 100;
                    return (
                        <div key={country} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-200 font-medium">{country}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400">{count.toLocaleString()} nodes</span>
                                    <span
                                        className="text-xs font-semibold w-12 text-right"
                                        style={{ color: BNB_GOLD }}
                                    >
                                        {pct.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ background: `rgba(243, 186, 47, 0.1)` }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${barWidth}%`,
                                        background: `linear-gradient(to right, ${BNB_GOLD}, #FFD97D)`,
                                        boxShadow: `0 0 10px rgba(243, 186, 47, 0.4)`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function BNBChainAnalyticsPage() {
    const [metrics, setMetrics] = useState<BNBChainDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timestamp, setTimestamp] = useState<number | null>(null);

    useScrollReveal(!loading && !!metrics);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/bnbchain');
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch data');
            setMetrics(data.data);
            setTimestamp(data.timestamp);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen relative" style={{ background: '#0a0800' }}>
                <ParticlesBackground />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <LoadingState />
                </div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <>
                <ParticlesBackground />
                <ErrorState message={error || 'No data available'} onRetry={fetchData} />
            </>
        );
    }

    return (
        <div
            className="min-h-screen relative overflow-x-hidden overflow-y-auto"
            style={{
                background: '#0a0800',
                backgroundImage: `radial-gradient(circle at 50% 0%, rgba(243, 186, 47, 0.07) 0%, transparent 60%)`,
            }}
        >
            <ParticlesBackground />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 container mx-auto px-6 py-10 md:py-12 max-w-[1400px]">

                    {/* Page header */}
                    <div className="mb-8 fade-in-up">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                                    BNB Chain{' '}
                                    <span style={{ color: BNB_GOLD }}>Analytics</span>
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    Cloud provider distribution across BNB Chain peers and validators.
                                </p>
                            </div>
                            {timestamp && (
                                <div
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-300 self-start mt-1 backdrop-blur-md border"
                                    style={{
                                        background: 'rgba(243, 186, 47, 0.08)',
                                        borderColor: 'rgba(243, 186, 47, 0.2)',
                                    }}
                                >
                                    <div
                                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                                        style={{ background: BNB_GOLD }}
                                    />
                                    Updated: {formatTimestamp(timestamp)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Validator market share banner */}
                    {metrics.ovhValidators > 0 && (
                        <section className="mb-8 fade-in-up">
                            <div
                                className="rounded-2xl p-6 border flex flex-wrap gap-6 items-center"
                                style={{
                                    background: 'rgba(243, 186, 47, 0.05)',
                                    borderColor: 'rgba(243, 186, 47, 0.2)',
                                }}
                            >
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                                        OVH Validators
                                    </p>
                                    <p className="text-3xl font-black" style={{ color: BNB_GOLD }}>
                                        {metrics.ovhValidators}{' '}
                                        <span className="text-lg text-white/40">/ {metrics.totalValidators}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                                        Validator Share
                                    </p>
                                    <p className="text-3xl font-black" style={{ color: BNB_GOLD }}>
                                        {metrics.validatorMarketShare.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* KPI Cards */}
                    <section className="mb-10 fade-in-up">
                        <KPICards
                            totalNodes={metrics.totalNodes}
                            ovhNodes={metrics.ovhNodes}
                            marketShare={metrics.marketShare}
                        />
                    </section>

                    {/* Provider Comparison Chart */}
                    <section className="mb-8 fade-in-up delay-100">
                        <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                    </section>

                    {/* Geo Distribution */}
                    <div className="fade-in-up delay-200">
                        {metrics.globalGeoDistribution &&
                        Object.keys(metrics.globalGeoDistribution).length > 0 ? (
                            <GeoDistribution geoDistribution={metrics.globalGeoDistribution} />
                        ) : metrics.geoDistribution &&
                          Object.keys(metrics.geoDistribution).length > 0 ? (
                            <GeoDistribution geoDistribution={metrics.geoDistribution} />
                        ) : null}
                    </div>

                </main>
            </div>
        </div>
    );
}

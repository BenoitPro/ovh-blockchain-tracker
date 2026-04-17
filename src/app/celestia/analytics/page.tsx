'use client';

import { useEffect, useState } from 'react';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import KPICards from '@/components/dashboard/KPICards';
import { CelestiaNodeMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { GlobeEuropeAfricaIcon } from '@heroicons/react/24/outline';
import ParticlesBackground from '@/components/ParticlesBackground';

function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleString('en-US', {
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#080218] to-[#060112] border border-[#7B2FBE]/15 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Geographic Distribution</h2>
                    <p className="text-sm text-gray-400 mt-1">Top 10 countries hosting Celestia nodes</p>
                </div>
                <GlobeEuropeAfricaIcon className="w-6 h-6 text-[#7B2FBE]/60" />
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
                                    <span className="text-xs font-semibold text-[#7B2FBE] w-12 text-right">{pct.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 bg-[#7B2FBE]/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${barWidth}%`,
                                        background: 'linear-gradient(to right, #7B2FBE, #9B4FDE)',
                                        boxShadow: '0 0 10px rgba(123,47,190,0.5)',
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

export default function CelestiaAnalyticsPage() {
    const [metrics, setMetrics] = useState<CelestiaNodeMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timestamp, setTimestamp] = useState<number | null>(null);

    useScrollReveal(!loading && !!metrics);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/celestia');
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

    useEffect(() => { fetchData(); }, []);

    if (loading) {
        return (
            <div className="min-h-screen relative bg-[#080414]">
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
            className="min-h-screen relative overflow-x-hidden overflow-y-auto celestia-theme"
            style={{
                background: '#080414',
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(123, 47, 190, 0.08) 0%, transparent 60%)'
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
                                    Celestia <span className="text-[#7B2FBE]">Analytics</span>
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    Cloud provider distribution across the Celestia peer network.
                                </p>
                            </div>
                            {timestamp && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7B2FBE]/10 border border-[#7B2FBE]/20 text-xs text-gray-300 self-start mt-1 backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#7B2FBE] animate-pulse" />
                                    Updated: {formatTimestamp(timestamp)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <section className="mb-10 fade-in-up">
                        <KPICards
                            totalNodes={metrics.totalPeers}
                            ovhNodes={metrics.ovhNodes}
                            marketShare={metrics.marketShare}
                            totalValidators={metrics.totalValidators}
                        />
                    </section>

                    {/* Provider Comparison Chart */}
                    <section className="mb-8 fade-in-up delay-100">
                        <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                    </section>

                    {/* Bottom grid: Geo Distribution */}
                    <div className="fade-in-up delay-200">
                        {metrics.globalGeoDistribution && Object.keys(metrics.globalGeoDistribution).length > 0 ? (
                            <GeoDistribution geoDistribution={metrics.globalGeoDistribution} />
                        ) : metrics.geoDistribution && Object.keys(metrics.geoDistribution).length > 0 ? (
                            <GeoDistribution geoDistribution={metrics.geoDistribution} />
                        ) : null}
                    </div>

                </main>
            </div>
        </div>
    );
}

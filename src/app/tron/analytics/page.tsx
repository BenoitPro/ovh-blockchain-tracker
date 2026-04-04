'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/dashboard/Header';
import KPICards from '@/components/dashboard/KPICards';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import ParticlesBackground from '@/components/ParticlesBackground';
import { TronDashboardMetrics, TronAPIResponse } from '@/types/tron';

const TRON_RED = '#FF060A';

export default function TronAnalyticsPage() {
    const [metrics, setMetrics] = useState<TronDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/tron');
            const data: TronAPIResponse = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch analytics');
            if (data.data) setMetrics(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const bgStyle = { background: '#0a0000' };

    if (loading) {
        return (
            <div className="min-h-screen relative" style={bgStyle}>
                <ParticlesBackground />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <LoadingState />
                </div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div style={bgStyle} className="min-h-screen relative">
                <ParticlesBackground />
                <div className="relative z-10">
                    <ErrorState message={error || 'No data available'} onRetry={fetchData} />
                </div>
            </div>
        );
    }

    const topCountries = Object.entries(metrics.globalGeoDistribution || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto tron-theme" style={bgStyle}>
            <ParticlesBackground />

            <div className="relative z-10 flex flex-col min-h-screen p-4 lg:p-8 xl:p-10 max-w-[1600px] mx-auto">
                <Header network="Tron" subtitle="Network Infrastructure Analytics" />

                <div className="mt-8 mb-12">
                    <KPICards
                        totalNodes={metrics.totalNodes || 0}
                        ovhNodes={metrics.ovhNodes || 0}
                        marketShare={metrics.marketShare || 0}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                    {/* Provider Breakdown */}
                    <div className="glass-card p-8 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white">Cloud Provider Distribution</h3>
                            <span
                                className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border"
                                style={{ color: TRON_RED, background: `${TRON_RED}18`, borderColor: `${TRON_RED}30` }}
                            >
                                {metrics.totalNodes} Nodes
                            </span>
                        </div>
                        <div className="flex-1">
                            <ProviderComparison providerBreakdown={metrics.providerBreakdown || []} />
                        </div>
                    </div>

                    {/* Geographic Distribution */}
                    <div className="glass-card p-10 flex flex-col">
                        <div className="mb-10">
                            <h3 className="text-2xl font-black text-white mb-2">Network Resiliency</h3>
                            <p className="text-gray-400 text-sm">Geographic node density across the TRON network.</p>
                        </div>

                        <div className="flex-1 space-y-8">
                            {topCountries.map(([country, count], i) => (
                                <div key={country} className="relative">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-black text-white/10 italic">#{i + 1}</span>
                                            <span className="text-lg font-bold text-white/80">{country}</span>
                                        </div>
                                        <span className="text-sm font-mono" style={{ color: TRON_RED }}>{count} Nodes</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 delay-300"
                                            style={{
                                                width: `${(count / metrics.totalNodes) * 100}%`,
                                                background: `linear-gradient(to right, ${TRON_RED}, #ff6b6b)`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div
                            className="mt-12 p-6 rounded-2xl border"
                            style={{ background: `${TRON_RED}08`, borderColor: `${TRON_RED}20` }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg" style={{ background: `${TRON_RED}20`, color: TRON_RED }}>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    The TRON network shows strong infrastructure presence across Asia and Europe, with <span style={{ color: TRON_RED }} className="font-bold">{metrics.marketShare.toFixed(1)}% of nodes</span> currently hosted on OVHcloud&apos;s industrial-grade network.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

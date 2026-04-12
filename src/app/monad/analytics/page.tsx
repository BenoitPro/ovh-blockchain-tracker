'use client';

import { useEffect, useState } from 'react';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import { MonadDashboardMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { GlobeEuropeAfricaIcon, UsersIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ParticlesBackground from '@/components/ParticlesBackground';

const ACCENT = '#836EF9';

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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d0b1a] to-[#08070f] border border-[#836EF9]/15 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Geographic Distribution</h2>
                    <p className="text-sm text-gray-400 mt-1">Top 10 countries hosting Monad validators</p>
                </div>
                <GlobeEuropeAfricaIcon className="w-6 h-6 text-[#836EF9]/60" />
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
                                    <span className="text-xs text-gray-400">{count.toLocaleString()} validators</span>
                                    <span className="text-xs font-semibold w-12 text-right" style={{ color: ACCENT }}>{pct.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${ACCENT}1a` }}>
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${barWidth}%`,
                                        background: `linear-gradient(to right, ${ACCENT}, #a78bfa)`,
                                        boxShadow: `0 0 10px ${ACCENT}80`,
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

export default function MonadAnalyticsPage() {
    const [metrics, setMetrics] = useState<MonadDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timestamp, setTimestamp] = useState<number | null>(null);

    useScrollReveal(!loading && !!metrics);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/monad');
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
            <div className="min-h-screen relative bg-[#08070f]">
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
                background: '#08070f',
                backgroundImage: `radial-gradient(circle at 50% 0%, ${ACCENT}14 0%, transparent 60%)`,
            }}
        >
            {/* Floating Particles Background */}
            <ParticlesBackground />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 container mx-auto px-6 py-10 md:py-12 max-w-[1400px]">

                    {/* Page header */}
                    <div className="mb-8 fade-in-up">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                                    Monad <span style={{ color: ACCENT }}>Analytics</span>
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    Validator distribution across the Monad network.
                                </p>
                            </div>
                            {timestamp && (
                                <div
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-300 self-start mt-1 backdrop-blur-md border"
                                    style={{ background: `${ACCENT}1a`, borderColor: `${ACCENT}33` }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                                    Updated: {formatTimestamp(timestamp)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <section className="mb-10 fade-in-up">
                        <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6 justify-center items-stretch w-full">
                            {[
                                {
                                    label: 'Total Validators',
                                    value: metrics.totalValidators.toLocaleString(),
                                    icon: UsersIcon,
                                },
                                {
                                    label: 'Active Validators',
                                    value: metrics.activeValidators.toLocaleString(),
                                    icon: CheckCircleIcon,
                                },
                                {
                                    label: 'Countries',
                                    value: metrics.countryCount.toLocaleString(),
                                    icon: MapPinIcon,
                                },
                                {
                                    label: 'Avg Success Rate',
                                    value: `${metrics.avgSuccessRate.toFixed(1)}%`,
                                    icon: CheckCircleIcon,
                                },
                            ].map(({ label, value, icon: Icon }) => (
                                <div
                                    key={label}
                                    className="flex flex-col items-center text-center p-5 rounded-2xl border flex-1 min-w-[160px]"
                                    style={{ borderColor: `${ACCENT}20`, background: `${ACCENT}06` }}
                                >
                                    <Icon className="w-5 h-5 mb-2 opacity-60" style={{ color: ACCENT }} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</span>
                                    <span className="text-3xl font-black" style={{ color: ACCENT }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Provider Breakdown — Coming Soon */}
                    <section className="mb-8 fade-in-up delay-100">
                        <div
                            className="rounded-2xl border p-8 text-center"
                            style={{ borderColor: `${ACCENT}20`, background: `${ACCENT}06` }}
                        >
                            <span
                                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border mb-4 inline-block"
                                style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}12` }}
                            >
                                Coming Soon
                            </span>
                            <h3 className="text-lg font-bold text-white mb-2">Provider Breakdown</h3>
                            <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
                                OVH vs AWS vs Hetzner distribution will be available once the MonadBFT crawler is implemented to retrieve validator IP addresses.
                            </p>
                        </div>
                    </section>

                    {/* Geo Distribution */}
                    <div className="fade-in-up delay-200">
                        {metrics.geoDistribution && Object.keys(metrics.geoDistribution).length > 0 ? (
                            <GeoDistribution geoDistribution={metrics.geoDistribution} />
                        ) : null}
                    </div>

                </main>
            </div>
        </div>
    );
}

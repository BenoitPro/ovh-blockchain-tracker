'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const WorldMap = dynamic(() => import('@/components/dashboard/WorldMap'), { ssr: false });
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import MethodologyModal from '@/components/dashboard/MethodologyModal';
import ParticlesBackground from '@/components/ParticlesBackground';
import BlockchainCubes from '@/components/BlockchainCubes';
import { MonadDashboardMetrics, MonadAPIResponse } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const ACCENT = '#836EF9';

export default function MonadPage() {
    const [metrics, setMetrics] = useState<MonadDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cachedAt, setCachedAt] = useState<number | null>(null);

    useScrollReveal(!loading && !!metrics);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/monad');
            const data: MonadAPIResponse = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch data');
            if (data.data) setMetrics(data.data);
            if (data.timestamp) setCachedAt(data.timestamp);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const bgStyle = {
        background: '#08070f',
        backgroundImage: "url('https://unpkg.com/three-globe/example/img/night-sky.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed' as const,
    };

    if (loading) {
        return (
            <div className="min-h-screen relative" style={bgStyle}>
                <BlockchainCubes opacity={0.07} count={10} />
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
                <BlockchainCubes opacity={0.07} count={10} />
                <ParticlesBackground />
                <div className="relative z-10">
                    <ErrorState message={error || 'No data available'} onRetry={fetchData} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={bgStyle}>
            <BlockchainCubes opacity={0.07} count={10} />
            <ParticlesBackground />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 flex flex-col p-2 md:p-4 w-full max-w-7xl mx-auto">

                    <AnimatedTagline
                        title={
                            <>Distribution of Monad Validators on <span style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}80` }}>OVHcloud</span></>
                        }
                        subtitle="Tracking validators on the high-performance EVM-compatible blockchain"
                    />

                    {cachedAt && (
                        <p className="text-xs text-gray-500 text-right -mt-2 mb-4">
                            Last updated: {new Date(cachedAt).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short'
                            })}
                        </p>
                    )}

                    {/* ── KPI Row ──────────────────────────────────────────────── */}
                    <div className="fade-in-up flex flex-wrap justify-center gap-6 mb-6 pt-2">
                        {/* Total Validators */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-white">{metrics.totalValidators}</span>
                            <span className="text-[10px] uppercase tracking-widest text-white/40">Total Validators</span>
                        </div>

                        {/* Active Validators */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-white">{metrics.activeValidators}</span>
                            <span className="text-[10px] uppercase tracking-widest text-white/40">Active Validators</span>
                        </div>

                        {/* Countries */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-white">{metrics.countryCount}</span>
                            <span className="text-[10px] uppercase tracking-widest text-white/40">Countries</span>
                        </div>

                        {/* OVH Market Share — Coming Soon */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-2xl font-black text-white/20">—</span>
                                <span
                                    className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
                                    style={{ color: ACCENT, borderColor: `${ACCENT}50`, background: `${ACCENT}12` }}
                                >
                                    Soon
                                </span>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-white/40">OVH Market Share</span>
                        </div>
                    </div>

                    {/* ── Coming Soon Banner ────────────────────────────────────── */}
                    <div
                        className="fade-in-up mb-6 px-5 py-4 rounded-2xl border text-sm text-white/60 leading-relaxed"
                        style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}08` }}
                    >
                        <span className="font-bold" style={{ color: ACCENT }}>Infrastructure detection coming soon.</span>{' '}
                        Monad uses a custom MonadBFT peer discovery protocol (signed name records) with no public RPC endpoint for validator IPs.
                        OVH market share and provider breakdown will be available once a dedicated crawler is implemented.
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                        {/* World Map */}
                        {Object.keys(metrics.geoDistribution).length > 0 && (
                            <section className="flex-1 flex flex-col fade-in-up relative z-10 w-full h-[600px] md:h-[700px]">
                                <div className="w-full h-full flex items-center justify-center">
                                    <WorldMap
                                        geoDistribution={metrics.geoDistribution}
                                        globalGeoDistribution={metrics.globalGeoDistribution || {}}
                                        totalNodes={metrics.totalValidators}
                                        ovhNodes={metrics.ovhNodes ?? 0}
                                        marketShare={metrics.marketShare ?? 0}
                                    />
                                </div>
                            </section>
                        )}
                    </div>
                </main>

                <MethodologyModal />
            </div>
        </div>
    );
}

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
import { CelestiaNodeMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const CELESTIA_PURPLE = '#7B2FBE';

export default function CelestiaPage() {
    const [metrics, setMetrics] = useState<CelestiaNodeMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cachedAt, setCachedAt] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'ovh' | 'global'>('global');

    useScrollReveal(!loading && !!metrics);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/celestia');
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch data');
            setMetrics(data.data);
            if (data.timestamp) setCachedAt(data.timestamp);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const bgStyle = {
        background: '#080414',
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
            <>
                <BlockchainCubes opacity={0.07} count={10} />
                <ParticlesBackground />
                <div style={bgStyle} className="min-h-screen relative">
                    <ErrorState message={error || 'No data available'} onRetry={fetchData} />
                </div>
            </>
        );
    }

    const ovhCount = metrics.ovhNodes;

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto celestia-theme" style={bgStyle}>
            <BlockchainCubes opacity={0.07} count={10} />
            <ParticlesBackground />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 flex flex-col p-2 md:p-4 w-full max-w-7xl mx-auto">

                    <AnimatedTagline
                        title={<>Distribution of Celestia Nodes</>}
                        subtitle="Tracking validators on the modular data availability network"
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        accentColor={CELESTIA_PURPLE}
                    />

                    {cachedAt && (
                        <p className="text-xs text-gray-500 text-right -mt-2 mb-4">
                            Last updated: {new Date(cachedAt).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short'
                            })}
                        </p>
                    )}

                    {/* Coverage widget */}
                    <div className="fade-in-up flex justify-center gap-10 mb-6 pt-2">
                        <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-white">{metrics.totalPeers}</span>
                                {metrics.totalValidators > 0 && (
                                    <span className="text-sm font-mono text-white/30">/ {metrics.totalValidators}</span>
                                )}
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-white/40">Peers with IP</span>
                            {metrics.totalValidators > 0 && (
                                <span className="text-[9px] text-white/25 italic">
                                    ~{Math.round((metrics.totalPeers / metrics.totalValidators) * 100)}% IP coverage
                                </span>
                            )}
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
                                        totalNodes={metrics.totalPeers}
                                        ovhNodes={ovhCount}
                                        marketShare={metrics.marketShare}
                                        viewMode={viewMode}
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

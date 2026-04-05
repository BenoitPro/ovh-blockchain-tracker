'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const WorldMap = dynamic(() => import('@/components/dashboard/WorldMap'), { ssr: false });
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import MethodologyModal from '@/components/dashboard/MethodologyModal';
import { EthSnapshotMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import ParticlesBackground from '@/components/ParticlesBackground';
import BlockchainCubes from '@/components/BlockchainCubes';

export default function EthereumPage() {
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

    const dashBg = {
        backgroundImage: "url('https://unpkg.com/three-globe/example/img/night-sky.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed' as const,
    };

    if (loading) {
        return (
            <div className="min-h-screen relative" style={dashBg}>
                <BlockchainCubes opacity={0.28} count={12} />
                <ParticlesBackground />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <LoadingState />
                </div>

            </div>
        );
    }


    if (error || !metrics) {
        return (
            <div className="min-h-screen relative" style={dashBg}>
                <BlockchainCubes opacity={0.28} count={12} />
                <ParticlesBackground />
                <ErrorState message={error || 'No data available'} onRetry={fetchData} />
            </div>
        );
    }

    const ovhCount = metrics.providerDistribution['ovh'] || 0;
    const ovhShare = metrics.totalNodes > 0 ? (ovhCount / metrics.totalNodes) * 100 : 0;

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={dashBg}>
            {/* Animated Blockchain Cubes Background (Subtle for Eth) */}
            <BlockchainCubes opacity={0.28} count={12} />

            {/* Floating Starry Points Background */}
            <ParticlesBackground />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 flex flex-col p-2 md:p-4 w-full max-w-7xl mx-auto">

                    <AnimatedTagline
                        title={
                            <>Distribution of Ethereum Nodes on <span style={{ color: 'var(--chain-accent)' }}>OVHcloud</span></>
                        }
                        subtitle="Empowering the decentralized network"
                    />

                    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                        {/* 1. Geographic Distribution - World Map (Centered and Enlarged) */}
                        {Object.keys(metrics.geoDistribution).length > 0 && (
                            <section className="flex-1 flex flex-col fade-in-up relative z-10 w-full h-[600px] md:h-[700px]">
                                <div className="w-full h-full flex items-center justify-center">
                                    <WorldMap 
                                        geoDistribution={metrics.geoDistribution} 
                                        globalGeoDistribution={metrics.geoDistribution}
                                        totalNodes={metrics.totalNodes}
                                        ovhNodes={ovhCount}
                                        marketShare={ovhShare}
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

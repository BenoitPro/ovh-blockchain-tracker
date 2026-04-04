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
import { SuiDashboardMetrics, SuiAPIResponse } from '@/types/sui';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const SUI_BLUE = '#4DA2FF';

export default function SuiPage() {
    const [metrics, setMetrics] = useState<SuiDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useScrollReveal(!loading && !!metrics);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/sui');
            const data: SuiAPIResponse = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch data');
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

    const bgStyle = {
        background: '#050510',
        backgroundImage: "url('https://unpkg.com/three-globe/example/img/night-sky.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed' as const,
    };

    if (loading) {
        return (
            <div className="min-h-screen relative" style={bgStyle}>
                <BlockchainCubes opacity={0.05} count={8} />
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
                <BlockchainCubes opacity={0.05} count={8} />
                <ParticlesBackground />
                <div className="relative z-10">
                    <ErrorState message={error || 'No data available'} onRetry={fetchData} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={bgStyle}>
            {/* Animated Blockchain Cubes Background */}
            <BlockchainCubes opacity={0.05} count={8} />

            {/* Floating Particles Background */}
            <ParticlesBackground />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 flex flex-col p-2 md:p-4 w-full max-w-7xl mx-auto">
                    
                    {/* Animated Tagline (Sui specific) */}
                    <AnimatedTagline 
                        title={
                            <>Distribution of Sui Nodes on <span style={{ color: SUI_BLUE, textShadow: `0 0 20px ${SUI_BLUE}80` }}>OVHcloud</span></>
                        }
                        subtitle="Ensuring a decentralized and resilient future for Sui Mainnet"
                    />

                    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                        {/* 1. Geographic Distribution - centered and enlarged */}
                        {metrics.geoDistribution && (
                            <section className="flex-1 flex flex-col relative z-10 w-full h-[600px] md:h-[700px]">
                                <div className="w-full h-full flex items-center justify-center">
                                    <WorldMap
                                        geoDistribution={metrics.geoDistribution}
                                        globalGeoDistribution={metrics.globalGeoDistribution || {}}
                                        totalNodes={metrics.totalNodes}
                                        ovhNodes={metrics.ovhNodes}
                                        marketShare={metrics.marketShare}
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

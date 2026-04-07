'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import KPICards from '@/components/dashboard/KPICards';
import dynamic from 'next/dynamic';
const WorldMap = dynamic(() => import('@/components/dashboard/WorldMap'), { ssr: false });
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import BlockchainCubes from '@/components/BlockchainCubes';
import ParticlesBackground from '@/components/ParticlesBackground';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import MethodologyModal from '@/components/dashboard/MethodologyModal';
import { DashboardMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';


export default function Home() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cachedAt, setCachedAt] = useState<number | null>(null);
    const router = useRouter();

    useScrollReveal(!loading && !!metrics);

    const handleCountryClick = useCallback((countryCode: string) => {
        router.push(`/country/${countryCode}`);
    }, [router]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/solana');
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

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen relative bg-[#050510]" style={{ backgroundImage: "url('https://unpkg.com/three-globe/example/img/night-sky.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
                <BlockchainCubes opacity={0.05} />
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
                <BlockchainCubes opacity={0.05} />
                <ParticlesBackground />
                <ErrorState message={error || 'No data available'} onRetry={fetchData} />
            </>
        );
    }

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto bg-[#050510]" style={{ backgroundImage: "url('https://unpkg.com/three-globe/example/img/night-sky.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            {/* Animated Blockchain Cubes Background (Subtle for map) */}
            <BlockchainCubes opacity={0.05} />

            {/* Floating Particles Background */}
            <ParticlesBackground />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col min-h-screen">

                <main className="flex-1 flex flex-col p-2 md:p-4 w-full max-w-7xl mx-auto">

                    {/* Animated Tagline */}
                    <AnimatedTagline
                        title={
                            <>Distribution of Solana Nodes on <span style={{ color: '#00F0FF', textShadow: '0 0 20px #00F0FF80' }}>OVHcloud</span></>
                        }
                        subtitle="Helping decentralize Web3 infrastructure"
                    />

                    {cachedAt && (
                        <p className="text-xs text-gray-500 text-right -mt-2 mb-4">
                            Last updated: {new Date(cachedAt).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short'
                            })}
                        </p>
                    )}

                    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                        {/* 1. Geographic Distribution - World Map (Centered and Enlarged) */}
                        {Object.keys(metrics.geoDistribution).length > 0 && (
                            <section className="flex-1 flex flex-col fade-in-up relative z-10 w-full h-[600px] md:h-[700px]">
                                <div className="w-full h-full flex items-center justify-center">
                                    <WorldMap
                                        geoDistribution={metrics.geoDistribution}
                                        globalGeoDistribution={metrics.globalGeoDistribution}
                                        onCountryClick={handleCountryClick}
                                        totalNodes={metrics.totalNodes}
                                        ovhNodes={metrics.ovhNodes}
                                        marketShare={metrics.marketShare}
                                    />
                                </div>
                            </section>
                        )}
                    </div>

                </main>
                
                {/* Methodology Modal Floating Button */}
                <MethodologyModal />
            </div>
        </div>
    );
}

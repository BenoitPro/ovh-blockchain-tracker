'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import KPICards from '@/components/dashboard/KPICards';
import WorldMap from '@/components/dashboard/WorldMap';
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
            <>
                <BlockchainCubes opacity={0.05} />
                <ParticlesBackground />
                <LoadingState />
            </>
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

                <main className="flex-1 flex flex-col p-6 w-full max-w-7xl mx-auto">

                    {/* Animated Tagline */}
                    <AnimatedTagline 
                        title={
                            <>Distribution of Solana Nodes on <span style={{ color: '#00F0FF', textShadow: '0 0 20px #00F0FF80' }}>OVHcloud</span></>
                        }
                        subtitle="Helping decentralize Web3 infrastructure"
                        accentColor="#00F0FF"
                    />

                    {/* 1. Geographic Distribution - World Map (Takes remaining space) */}
                    {Object.keys(metrics.geoDistribution).length > 0 && (
                        <section className="flex-1 flex flex-col mb-2 fade-in-up relative z-10 w-full">
                            <div className="w-full flex-grow flex items-center justify-center">
                                <WorldMap
                                    geoDistribution={metrics.geoDistribution}
                                    onCountryClick={handleCountryClick}
                                />
                            </div>
                        </section>
                    )}

                    {/* 2. KPI Cards (Moved back down) */}
                    <section className="mt-0 mb-4 fade-in-up delay-100 flex-shrink-0 relative z-20">
                        <KPICards
                            totalNodes={metrics.totalNodes}
                            ovhNodes={metrics.ovhNodes}
                            marketShare={metrics.marketShare}
                        />
                    </section>

                </main>
                
                {/* Methodology Modal Floating Button */}
                <MethodologyModal network="solana" accentColor="#00F0FF" />
            </div>
        </div>
    );
}

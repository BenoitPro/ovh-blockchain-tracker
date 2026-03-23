'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import KPICards from '@/components/dashboard/KPICards';
import WorldMap from '@/components/dashboard/WorldMap';
import Footer from '@/components/dashboard/Footer';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import BlockchainCubes from '@/components/BlockchainCubes';
import ParticlesBackground from '@/components/ParticlesBackground';
import TrendChart from '@/components/dashboard/TrendChart';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import { DashboardMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';


export default function Home() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Remove Ethereum light theme if user navigated back from /ethereum
    useEffect(() => {
        document.documentElement.classList.remove('eth-theme');
    }, []);

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
                <BlockchainCubes />
                <ParticlesBackground />
                <LoadingState />
            </>
        );
    }

    if (error || !metrics) {
        return (
            <>
                <BlockchainCubes />
                <ParticlesBackground />
                <ErrorState message={error || 'No data available'} onRetry={fetchData} />
            </>
        );
    }

    return (
        <div className="min-h-screen relative">
            {/* Animated Blockchain Cubes Background */}
            <BlockchainCubes />

            {/* Floating Particles Background */}
            <ParticlesBackground />

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content — offset by sidebar width */}
            <div className="relative z-10 ml-60">

                <main className="container mx-auto px-6 py-6 md:py-8">

                    {/* 1. Geographic Distribution - World Map */}
                    {Object.keys(metrics.geoDistribution).length > 0 && (
                        <section className="mb-12 fade-in-up">
                            <WorldMap
                                geoDistribution={metrics.geoDistribution}
                                onCountryClick={handleCountryClick}
                            />
                        </section>
                    )}

                    {/* 2. KPI Cards */}
                    <section className="mb-12 fade-in-up delay-100">
                        <KPICards
                            ovhNodes={metrics.ovhNodes}
                            marketShare={metrics.marketShare}
                            stakeShare={metrics.totalStake ? (metrics.ovhStake || 0) / metrics.totalStake * 100 : 0}
                        />
                    </section>

                    {/* 3. Provider Comparison Chart */}
                    <section className="mb-12 fade-in-up delay-100">
                        <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                    </section>

                    {/* 4. Trend Chart - Market Share Evolution */}
                    <section className="mb-12 fade-in-up delay-200">
                        <TrendChart />
                    </section>

                </main>

                <Footer />
            </div>
        </div>
    );
}

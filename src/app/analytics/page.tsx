'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/dashboard/Footer';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import ParticlesBackground from '@/components/ParticlesBackground';
import TrendChart from '@/components/dashboard/TrendChart';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import { DashboardMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function AnalyticsPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);



    useScrollReveal(!loading && !!metrics);

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
            <div className="min-h-screen relative bg-[#050510]">
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
        <div className="min-h-screen relative overflow-hidden bg-[#050510]">
            {/* Floating Particles Background */}
            <ParticlesBackground />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col min-h-screen">

                <main className="flex-1 container mx-auto px-6 py-10 md:py-12 max-w-[1400px]">
                    
                    <div className="mb-8 fade-in-up">
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Analytics & Market Trends</h1>
                        <p className="text-gray-400 text-sm">Detailed ecosystem distribution and historical performance metrics.</p>
                    </div>

                    {/* Provider Comparison Chart */}
                    <section className="mb-12 fade-in-up delay-100">
                        <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                    </section>

                    {/* Trend Chart - Market Share Evolution */}
                    <section className="mb-12 fade-in-up delay-200">
                        <TrendChart />
                    </section>

                </main>

                <Footer />
            </div>
        </div>
    );
}

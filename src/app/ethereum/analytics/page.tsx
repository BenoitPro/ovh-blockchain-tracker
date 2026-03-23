'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/dashboard/Footer';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import { EthSnapshotMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function EthereumAnalyticsPage() {
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

    if (loading) return <LoadingState />;
    if (error || !metrics) return <ErrorState message={error || 'No data available'} onRetry={fetchData} />;

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 container mx-auto px-6 py-10 md:py-12 max-w-[1400px]">

                    <div className="mb-8 fade-in-up">
                        <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
                            Ethereum Analytics
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Provider distribution across the Ethereum execution-layer network.
                        </p>
                    </div>

                    {/* Provider Comparison Chart */}
                    <section className="mb-12 fade-in-up delay-100">
                        <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                    </section>

                </main>

                <Footer />
            </div>
        </div>
    );
}

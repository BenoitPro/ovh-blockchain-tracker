'use client';

import { useEffect, useState } from 'react';
import KPICards from '@/components/dashboard/KPICards';
import WorldMap from '@/components/dashboard/WorldMap';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import MethodologyModal from '@/components/dashboard/MethodologyModal';
import { EthSnapshotMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';

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

    if (loading) return <LoadingState />;
    if (error || !metrics) return <ErrorState message={error || 'No data available'} onRetry={fetchData} />;

    const ovhCount = metrics.providerDistribution['ovh'] || 0;
    const ovhShare = metrics.totalNodes > 0 ? (ovhCount / metrics.totalNodes) * 100 : 0;

    return (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto">
            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 flex flex-col p-2 md:p-4 w-full max-w-7xl mx-auto">

                    <AnimatedTagline
                        title={
                            <>Distribution of Ethereum Nodes on <span style={{ color: '#627EEA' }}>OVHcloud</span></>
                        }
                        subtitle="Empowering the decentralized network"
                        accentColor="#627EEA"
                    />

                    {/* 1. Geographic Distribution - World Map (Takes remaining space) */}
                    {Object.keys(metrics.geoDistribution).length > 0 && (
                        <section className="flex-1 flex flex-col mb-1 fade-in-up relative z-10 w-full">
                            <div className="w-full flex-grow flex items-center justify-center">
                                <WorldMap geoDistribution={metrics.geoDistribution} />
                            </div>
                        </section>
                    )}

                    {/* 2. KPI Cards */}
                    <section className="mt-0 mb-2 fade-in-up delay-100 flex-shrink-0 relative z-20">
                        <KPICards
                            totalNodes={metrics.totalNodes}
                            ovhNodes={ovhCount}
                            marketShare={ovhShare}
                            network="ethereum"
                        />
                    </section>

                </main>

                <MethodologyModal network="ethereum" accentColor="#627EEA" />
            </div>
        </div>
    );
}

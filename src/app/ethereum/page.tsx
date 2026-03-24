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

                    <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-stretch gap-4 overflow-hidden">
                        {/* 1. Geographic Distribution - World Map (Left on desktop) */}
                        {Object.keys(metrics.geoDistribution).length > 0 && (
                            <section className="flex-[3] flex flex-col fade-in-up relative z-10 w-full min-h-[450px] md:min-h-[550px]">
                                <div className="w-full flex-grow flex items-center justify-center">
                                    <WorldMap geoDistribution={metrics.geoDistribution} />
                                </div>
                            </section>
                        )}

                        {/* 2. KPI Cards (Right Sidebar on desktop, Bottom on mobile) */}
                        <section className="flex-1 flex flex-col justify-center fade-in-up delay-100 relative z-20 w-full lg:w-auto lg:min-w-[300px] lg:max-w-[350px]">
                            {/* Desktop Version: Vertical Sidebar */}
                            <div className="hidden lg:block">
                                <KPICards
                                    totalNodes={metrics.totalNodes}
                                    ovhNodes={ovhCount}
                                    marketShare={ovhShare}
                                    network="ethereum"
                                    vertical={true}
                                    align="right"
                                />
                            </div>
                            
                            {/* Mobile/Tablet Version: Vertical stacked below globe */}
                            <div className="lg:hidden w-full mt-2">
                                <KPICards
                                    totalNodes={metrics.totalNodes}
                                    ovhNodes={ovhCount}
                                    marketShare={ovhShare}
                                    network="ethereum"
                                    vertical={true}
                                    align="center"
                                />
                            </div>
                        </section>
                    </div>

                </main>

                <MethodologyModal network="ethereum" accentColor="#627EEA" />
            </div>
        </div>
    );
}

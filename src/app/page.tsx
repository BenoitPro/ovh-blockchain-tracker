'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
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

            {/* Main Content */}
            <div className="relative z-10">
                <Header />

                <main className="container mx-auto px-6 py-6 md:py-8">
                    {/* Discrete Methodology Note */}
                    <section className="mb-6 fade-in-up flex justify-start">
                        <details className="group opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <summary className="text-[10px] md:text-xs text-gray-400 hover:text-[#00F0FF] cursor-pointer list-none flex items-center gap-2 font-medium outline-none">
                                <span>* Methodology</span>
                                <svg
                                    className="w-3 h-3 transition-transform duration-300 group-open:rotate-180"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </summary>
                            <div className="mt-3 p-4 text-[10px] md:text-xs text-gray-300 space-y-2 leading-relaxed border border-white/5 bg-black/40 backdrop-blur-md rounded-lg max-w-2xl shadow-lg">
                                <p>
                                    We employ an industry-standard methodology aligned with frameworks like the one described in the <a href="https://messari.io/report/evaluating-validator-decentralization-geographic-and-infrastructure-distribution-in-proof-of-stake-networks" target="_blank" rel="noopener noreferrer" className="text-[#00F0FF] hover:underline">Messari Validator Decentralization Report</a>.
                                </p>
                                <ol className="list-decimal list-inside space-y-3 ml-1 text-gray-400">
                                    <li>
                                        <strong className="text-white/80">Data Collection:</strong>
                                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                            <li><span className="text-[#00F0FF] text-[10px] uppercase font-bold tracking-wider">Solana:</span> We query the official Solana RPC to get an exact census of all active validators and RPC nodes IPs.</li>
                                            <li><span className="text-purple-400 text-[10px] uppercase font-bold tracking-wider">Ethereum:</span> Due to its pure P2P nature, we use an industry-standard network crawler (similar to Ethernodes.org) iterating over the Discv4/Discv5 DHT to map publicly discoverable nodes.</li>
                                        </ul>
                                    </li>
                                    <li><strong className="text-white/80">ASN Resolution:</strong> We map every discovered IP to its Autonomous System Number (ASN) via MaxMind GeoLite2 for exact cloud provider identification.</li>
                                    <li><strong className="text-white/80">Geolocation & Weighting:</strong> Map IP to country/city, and capital-weight nodes based on Stake/Consensus influence where applicable.</li>
                                </ol>
                                <p className="pt-2 text-white/50 italic border-t border-white/5 mt-3">
                                    Note: For Solana, our dataset includes the entire network footprint (~5,000 nodes). For Ethereum, node counts are estimations limited to publicly discoverable nodes, as some institutional providers deliberately disable P2P discovery behind firewalls.
                                </p>
                            </div>
                        </details>
                    </section>

                    {/* KPI Cards */}
                    <section className="mb-12 fade-in-up">
                        <KPICards
                            ovhNodes={metrics.ovhNodes}
                            marketShare={metrics.marketShare}
                            stakeShare={metrics.totalStake ? (metrics.ovhStake || 0) / metrics.totalStake * 100 : 0}
                        />
                    </section>

                    {/* Trend Chart - Market Share Evolution */}
                    <section className="mb-12 fade-in-up delay-100">
                        <TrendChart />
                    </section>

                    {/* Provider Comparison Chart */}
                    <section className="mb-12 fade-in-up delay-100">
                        <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                    </section>


                    {/* Geographic Distribution - World Map */}
                    {Object.keys(metrics.geoDistribution).length > 0 && (
                        <section className="mb-12 fade-in-up delay-200">
                            <WorldMap
                                geoDistribution={metrics.geoDistribution}
                                onCountryClick={handleCountryClick}
                            />
                        </section>
                    )}
                </main>

                <Footer />
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import KPICards from '@/components/dashboard/KPICards';
import DonutChart from '@/components/dashboard/DonutChart';
import ValidatorsList from '@/components/dashboard/ValidatorsList';
import WorldMap from '@/components/dashboard/WorldMap';
import Footer from '@/components/dashboard/Footer';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import BlockchainCubes from '@/components/BlockchainCubes';
import ParticlesBackground from '@/components/ParticlesBackground';
import TrendChart from '@/components/dashboard/TrendChart';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import { DashboardMetrics } from '@/types';

function useScrollReveal(ready: boolean) {
    const observe = useCallback(() => {
        if (!ready) return () => { };

        // Wait a tiny bit for React to actually flush the DOM after loading=false
        const timeoutId = setTimeout(() => {
            const elements = document.querySelectorAll('.fade-in-up');
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.12 }
            );
            elements.forEach((el) => observer.observe(el));
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [ready]);

    useEffect(() => {
        const cleanup = observe();
        return cleanup;
    }, [observe]);
}

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
                                <ol className="list-decimal list-inside space-y-1 ml-1 text-gray-400">
                                    <li><strong className="text-white/80">Data Collection:</strong> Query Solana RPC for active validators & RPC nodes IPs.</li>
                                    <li><strong className="text-white/80">ASN Resolution:</strong> Map IP to Autonomous System Number (ASN) via MaxMind GeoLite2 for exact CSP identification.</li>
                                    <li><strong className="text-white/80">Geolocation:</strong> Map IP to country/city.</li>
                                    <li><strong className="text-white/80">Capital-weighting:</strong> Prioritize Stake over node count to reflect consensus weight.</li>
                                </ol>
                                <p className="pt-2 text-white/50 italic border-t border-white/5 mt-2">
                                    Note: Unlike the Messari report which focuses exclusively on Active Validators (~1,800 nodes), our dataset includes the entire network footprint, tracking both voting validators and non-voting RPC nodes (~5,000 nodes) to provide a broader view of physical infrastructure reliance.
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

                    {/* Charts and Validators Grid */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        <div className="fade-in-up delay-100">
                            <DonutChart providerDistribution={metrics.providerDistribution} />
                        </div>
                        <div className="fade-in-up delay-200">
                            <ValidatorsList validators={metrics.topValidators} />
                        </div>
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

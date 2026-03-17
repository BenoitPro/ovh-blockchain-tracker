'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import WorldMap from '@/components/dashboard/WorldMap';
import Footer from '@/components/dashboard/Footer';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import ChainToggle from '@/components/ChainToggle';
import { EthSnapshotMetrics } from '@/types';
import { ServerIcon, ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline';

const ETH_COLOR = '#627EEA';

function useScrollReveal(ready: boolean) {
    const observe = useCallback(() => {
        if (!ready) return () => { };
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

function formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function EthereumPage() {
    const [metrics, setMetrics] = useState<EthSnapshotMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Apply light theme on mount, remove on unmount
    useEffect(() => {
        document.documentElement.classList.add('eth-theme');
        return () => {
            document.documentElement.classList.remove('eth-theme');
        };
    }, []);

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-2 border-[#627EEA]/30 border-t-[#627EEA] animate-spin mx-auto" />
                    <p className="text-slate-400 text-sm">Loading Ethereum data...</p>
                </div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md px-6">
                    <p className="text-2xl font-bold text-slate-700">
                        {error?.includes('No Ethereum snapshot') ? 'No snapshot yet' : 'Error'}
                    </p>
                    <p className="text-slate-500 text-sm leading-relaxed">{error || 'No data available'}</p>
                    {error?.includes('No Ethereum snapshot') && (
                        <div className="mt-4 p-4 bg-[#627EEA]/8 border border-[#627EEA]/20 rounded-xl text-left">
                            <p className="text-xs font-mono text-slate-600 leading-relaxed">
                                # Run the crawler first<br />
                                ./scripts/crawl-ethereum.sh nodes.json 30m<br />
                                npx tsx scripts/process-eth-snapshot.ts nodes.json
                            </p>
                        </div>
                    )}
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                        style={{ background: `${ETH_COLOR}18`, border: `1px solid ${ETH_COLOR}40`, color: ETH_COLOR }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const ovhCount = metrics.providerDistribution['ovh'] || 0;
    const ovhShare = metrics.totalNodes > 0 ? (ovhCount / metrics.totalNodes) * 100 : 0;

    return (
        <div className="min-h-screen relative">
            {/* Main Content */}
            <div className="relative z-10">

                {/* ── Header ── */}
                <header className="relative border-b border-[#627EEA]/12 bg-white/75 backdrop-blur-xl z-20"
                    style={{ boxShadow: '0 1px 24px rgba(98,126,234,0.07)' }}
                >
                    <div className="container mx-auto px-4 py-4 md:py-5">
                        <div className="flex flex-col items-center justify-center space-y-2 md:space-y-3">
                            {/* OVH Logo */}
                            <a
                                href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block cursor-pointer"
                            >
                                <div className="relative z-10 transition-transform duration-700 group-hover:scale-110">
                                    <Image
                                        src="/ovhcloud-logo.png"
                                        alt="OVHcloud"
                                        width={400}
                                        height={100}
                                        className="h-9 md:h-12 lg:h-14 w-auto"
                                        style={{ filter: 'brightness(0) saturate(100%) invert(14%) sepia(30%) saturate(500%) hue-rotate(190deg) brightness(90%)' }}
                                        priority
                                    />
                                </div>
                                <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 -z-10 scale-[2]"
                                    style={{ background: `radial-gradient(circle, ${ETH_COLOR}50, transparent)` }} />
                            </a>

                            {/* Title */}
                            <div className="text-center">
                                <h1 className="text-xs md:text-sm lg:text-base font-medium text-slate-500 tracking-[0.2em] md:tracking-[0.4em] uppercase">
                                    Ethereum Infrastructure{' '}
                                    <span className="font-black" style={{ color: ETH_COLOR }}>
                                        Monitor
                                    </span>
                                </h1>
                            </div>

                            {/* Chain Toggle */}
                            <div className="pt-1">
                                <ChainToggle />
                            </div>
                        </div>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px]"
                        style={{ background: `linear-gradient(to right, transparent, ${ETH_COLOR}60, transparent)` }} />
                </header>

                {/* ── Main ── */}
                <main className="container mx-auto px-6 py-6 md:py-8">

                    {/* Methodology */}
                    <section className="mb-6 fade-in-up flex justify-start">
                        <details className="group opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <summary className="text-[10px] md:text-xs text-slate-400 hover:text-[#627EEA] cursor-pointer list-none flex items-center gap-2 font-medium outline-none">
                                <span>* Methodology</span>
                                <svg className="w-3 h-3 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </summary>
                            <div className="mt-3 p-4 text-[10px] md:text-xs text-slate-600 space-y-2 leading-relaxed max-w-2xl shadow-lg rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(98,126,234,0.15)', backdropFilter: 'blur(12px)' }}
                            >
                                <p>
                                    Ethereum execution-layer nodes are discovered via the <strong className="text-slate-800">devp2p/discv4</strong> protocol using the official EF crawler (<code style={{ color: ETH_COLOR }}>go-ethereum/cmd/devp2p</code>).
                                </p>
                                <ol className="list-decimal list-inside space-y-1 ml-1 text-slate-500">
                                    <li><strong className="text-slate-700">Crawl:</strong> 30-60 min P2P crawl, typically discovers 5,000–8,000 execution nodes.</li>
                                    <li><strong className="text-slate-700">IP Extraction:</strong> Parse enode URLs <code style={{ color: ETH_COLOR }}>enode://pubkey@IP:PORT</code> to extract IPs.</li>
                                    <li><strong className="text-slate-700">ASN Resolution:</strong> Map IP → ASN via MaxMind GeoLite2 (offline, ~1ms/IP).</li>
                                    <li><strong className="text-slate-700">Provider Matching:</strong> Match ASN against known cloud provider lists (same as Solana tracker).</li>
                                </ol>
                                <p className="pt-2 text-slate-400 italic border-t border-slate-200 mt-2">
                                    Note: Snapshot-based. Data from a single crawl session, updated manually. Unlike Solana, Ethereum has no <code>getClusterNodes</code> RPC.
                                </p>
                            </div>
                        </details>
                    </section>

                    {/* ── KPI Cards ── */}
                    <section className="mb-12 fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Total Nodes */}
                            <div className="group relative overflow-hidden rounded-2xl glass-card hover:scale-[1.02] transition-all duration-300 cursor-default">
                                <div className="absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500"
                                    style={{ background: `radial-gradient(ellipse at top left, ${ETH_COLOR}18, transparent 70%)` }} />
                                <div className="relative p-6 z-10">
                                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Total Execution Nodes</p>
                                    <p className="text-3xl font-black" style={{ color: ETH_COLOR }}>
                                        {metrics.totalNodes.toLocaleString()}
                                    </p>
                                    <div className="mt-4 flex justify-end">
                                        <div className="p-2 rounded-lg group-hover:scale-110 transition-transform duration-300"
                                            style={{ background: `${ETH_COLOR}12`, border: `1px solid ${ETH_COLOR}25` }}>
                                            <ServerIcon className="w-6 h-6" style={{ color: ETH_COLOR }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* OVH Nodes */}
                            <div className="group relative overflow-hidden rounded-2xl glass-card hover:scale-[1.02] transition-all duration-300 cursor-default">
                                <div className="absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500"
                                    style={{ background: 'radial-gradient(ellipse at top left, rgba(0,240,255,0.10), transparent 70%)' }} />
                                <div className="relative p-6 z-10">
                                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">OVHcloud Nodes</p>
                                    <p className="text-3xl font-black text-[#00AACC]">
                                        {ovhCount.toLocaleString()}
                                    </p>
                                    <div className="mt-4 flex justify-end">
                                        <div className="p-2 rounded-lg group-hover:scale-110 transition-transform duration-300"
                                            style={{ background: 'rgba(0,170,204,0.10)', border: '1px solid rgba(0,170,204,0.22)' }}>
                                            <ChartPieIcon className="w-6 h-6 text-[#00AACC]" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Market Share */}
                            <div className="group relative overflow-hidden rounded-2xl glass-card hover:scale-[1.02] transition-all duration-300 cursor-default">
                                <div className="absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500"
                                    style={{ background: 'radial-gradient(ellipse at top left, rgba(107,79,187,0.10), transparent 70%)' }} />
                                <div className="relative p-6 z-10">
                                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">OVHcloud Market Share</p>
                                    <p className="text-3xl font-black text-[#6B4FBB]">
                                        {ovhShare.toFixed(2)}%
                                    </p>
                                    <div className="mt-4 flex justify-between items-end">
                                        <p className="text-[10px] text-slate-400">
                                            {formatTimestamp(metrics.timestamp)}
                                            {metrics.crawlDurationMin && ` · ${metrics.crawlDurationMin}min crawl`}
                                        </p>
                                        <div className="p-2 rounded-lg group-hover:scale-110 transition-transform duration-300"
                                            style={{ background: 'rgba(107,79,187,0.10)', border: '1px solid rgba(107,79,187,0.22)' }}>
                                            <ClockIcon className="w-6 h-6 text-[#6B4FBB]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Provider Comparison — dark widget on light page ── */}
                    <section className="mb-12 fade-in-up delay-100">
                        <div className="rounded-2xl overflow-hidden shadow-xl"
                            style={{ boxShadow: '0 8px 40px rgba(98,126,234,0.10), 0 2px 12px rgba(98,126,234,0.06)' }}>
                            <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                        </div>
                    </section>

                    {/* ── World Map — dark widget on light page ── */}
                    {Object.keys(metrics.geoDistribution).length > 0 && (
                        <section className="mb-12 fade-in-up delay-200">
                            <div className="rounded-2xl overflow-hidden shadow-xl"
                                style={{ boxShadow: '0 8px 40px rgba(98,126,234,0.10), 0 2px 12px rgba(98,126,234,0.06)' }}>
                                <WorldMap geoDistribution={metrics.geoDistribution} />
                            </div>
                        </section>
                    )}
                </main>

                {/* ── Footer — light variant ── */}
                <footer className="relative mt-12"
                    style={{ borderTop: '1px solid rgba(98,126,234,0.12)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)' }}
                >
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: `linear-gradient(to right, transparent, ${ETH_COLOR}50, transparent)` }} />
                    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
                        <div className="text-center">
                            <p className="text-slate-500 text-sm">
                                Powered by{' '}
                                <a href="https://www.ovhcloud.com/en/bare-metal" target="_blank" rel="noopener noreferrer"
                                    className="font-semibold transition-colors duration-200 hover:underline"
                                    style={{ color: ETH_COLOR }}>
                                    OVHcloud Bare Metal
                                </a>
                            </p>
                            <p className="text-slate-400 text-xs mt-2">
                                Ethereum execution-layer node tracker · Snapshot-based
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

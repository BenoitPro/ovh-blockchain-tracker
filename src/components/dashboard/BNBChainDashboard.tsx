'use client';

import Header from '@/components/dashboard/Header';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import BlockchainCubes from '@/components/BlockchainCubes';
import ParticlesBackground from '@/components/ParticlesBackground';
import { BNBChainDashboardMetrics } from '@/types/bnbchain';
import { ProviderBreakdownEntry } from '@/types/dashboard';

const BNB_GOLD = '#F3BA2F';

interface BNBChainDashboardProps {
    metrics: BNBChainDashboardMetrics;
    cachedAt: number;
    isStale?: boolean;
}

function formatLastUpdated(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });
}

function KPIPill({
    label,
    value,
    highlight,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div
            className="px-6 py-4 rounded-xl border text-center"
            style={{
                background: highlight ? `rgba(243, 186, 47, 0.07)` : 'rgba(255, 255, 255, 0.03)',
                borderColor: highlight ? `rgba(243, 186, 47, 0.25)` : 'rgba(255, 255, 255, 0.08)',
            }}
        >
            <div
                className="text-2xl font-black"
                style={{ color: highlight ? BNB_GOLD : '#ffffff' }}
            >
                {value}
            </div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
        </div>
    );
}

export default function BNBChainDashboard({ metrics, cachedAt, isStale }: BNBChainDashboardProps) {
    const {
        totalNodes,
        totalValidators,
        ovhNodes,
        ovhValidators,
        marketShare,
        validatorMarketShare,
        providerBreakdown,
    } = metrics;

    const dominantProvider = providerBreakdown[0] ?? null;

    const chartData: ProviderBreakdownEntry[] = providerBreakdown.map((p) => ({
        key: p.key,
        label: p.label,
        nodeCount: p.nodeCount,
        marketShare: p.marketShare,
        color: p.color,
        subProviders: p.subProviders,
    }));

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <BlockchainCubes opacity={0.05} count={8} />
            <ParticlesBackground />
            <main className="relative z-10 p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
                <Header network="BNB Chain" subtitle="Node Infrastructure & Decentralization Tracking" />

                <div className="mt-8 mb-10">
                    <AnimatedTagline
                        text={`TRACKING ${totalNodes} DISCOVERED PEERS • BNB CHAIN NETWORK OVERVIEW`}
                    />
                </div>

                {/* Last updated + stale warning */}
                <div className="mb-6 flex items-center gap-3 text-xs text-gray-500">
                    <span>Last updated: {formatLastUpdated(cachedAt)}</span>
                    {isStale && (
                        <span className="px-2 py-0.5 rounded text-yellow-400 border border-yellow-400/30 bg-yellow-400/10">
                            Stale data — refresh pending
                        </span>
                    )}
                </div>

                {/* Main hook banner */}
                {dominantProvider && (
                    <div
                        className="mb-12 relative overflow-hidden rounded-2xl p-8 border"
                        style={{
                            background: 'linear-gradient(135deg, rgba(243, 186, 47, 0.05), rgba(0, 0, 0, 0.4))',
                            borderColor: 'rgba(243, 186, 47, 0.2)',
                        }}
                    >
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1">
                                <div
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4"
                                    style={{
                                        background: 'rgba(243, 186, 47, 0.1)',
                                        border: '1px solid rgba(243, 186, 47, 0.3)',
                                    }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full animate-pulse"
                                        style={{ background: BNB_GOLD }}
                                    />
                                    <span
                                        className="text-xs font-medium tracking-widest uppercase"
                                        style={{ color: BNB_GOLD }}
                                    >
                                        Infrastructure Concentration Index
                                    </span>
                                </div>

                                <h2 className="text-3xl font-black text-white mb-4">
                                    {dominantProvider.marketShare.toFixed(1)}%{' '}
                                    <span style={{ color: BNB_GOLD }}>
                                        {dominantProvider.label} Concentration
                                    </span>
                                </h2>

                                <p className="text-gray-400 text-sm leading-relaxed max-w-lg mb-6">
                                    We discovered {totalNodes.toLocaleString()} BNB Chain peers via the{' '}
                                    <code className="text-xs bg-white/5 px-1 py-0.5 rounded">admin_peers</code> RPC
                                    endpoint. The network runs approximately {totalValidators} active validators
                                    (elected stakers). Over {dominantProvider.marketShare.toFixed(0)}% of discovered
                                    nodes are concentrated on {dominantProvider.label}.
                                </p>

                                <a
                                    href="/bnbchain/use-cases"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all text-black hover:scale-105"
                                    style={{
                                        background: BNB_GOLD,
                                        boxShadow: `0 0 20px rgba(243, 186, 47, 0.3)`,
                                    }}
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                    Deploy on OVHcloud
                                </a>
                            </div>

                            {/* KPI pills */}
                            <div className="flex flex-col gap-3 shrink-0 min-w-[180px]">
                                <KPIPill
                                    label="Peers Discovered"
                                    value={totalNodes.toLocaleString()}
                                    highlight
                                />
                                <KPIPill
                                    label="OVH Nodes"
                                    value={ovhNodes > 0 ? ovhNodes.toString() : '0'}
                                    highlight={ovhNodes > 0}
                                />
                                <KPIPill
                                    label="OVH Market Share"
                                    value={ovhNodes > 0 ? `${marketShare.toFixed(1)}%` : 'N/A'}
                                    highlight={ovhNodes > 0}
                                />
                                {totalValidators > 0 && (
                                    <KPIPill
                                        label="OVH Validators"
                                        value={
                                            ovhValidators > 0
                                                ? `${ovhValidators} / ${totalValidators}`
                                                : `0 / ${totalValidators}`
                                        }
                                        highlight={ovhValidators > 0}
                                    />
                                )}
                                {ovhValidators > 0 && (
                                    <KPIPill
                                        label="Validator Share"
                                        value={`${validatorMarketShare.toFixed(1)}%`}
                                        highlight
                                    />
                                )}
                            </div>
                        </div>

                        {/* Visual accent */}
                        <div
                            className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none"
                            style={{
                                background: `radial-gradient(circle at right, ${BNB_GOLD} 0%, transparent 60%)`,
                            }}
                        />
                    </div>
                )}

                {/* Provider breakdown chart */}
                {chartData.length > 0 && (
                    <div className="mt-12 max-w-4xl">
                        <ProviderComparison providerBreakdown={chartData} />
                    </div>
                )}
            </main>
        </div>
    );
}

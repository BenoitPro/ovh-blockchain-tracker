'use client';

import Header from '@/components/dashboard/Header';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import BlockchainCubes from '@/components/BlockchainCubes';
import ParticlesBackground from '@/components/ParticlesBackground';
import { HyperliquidDashboardMetrics } from '@/types/hyperliquid';
import { ProviderBreakdownEntry } from '@/types/dashboard';

interface HyperliquidDashboardProps {
    metrics: HyperliquidDashboardMetrics;
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

export default function HyperliquidDashboard({ metrics, cachedAt, isStale }: HyperliquidDashboardProps) {
    const { activeValidators, ovhValidators, marketShare, providerBreakdown, totalStake, allValidators } = metrics;

    // Format total stake as HYPE tokens (raw unit / 1e8)
    const totalStakeHYPE = (totalStake / 1e8).toLocaleString('en-US', {
        maximumFractionDigits: 0,
    });

    const jailedCount = (allValidators ?? []).filter(v => v.isJailed).length;

    const avgUptime = (() => {
        const withUptime = (allValidators ?? []).filter(v => typeof v.dailyUptime === 'number' && v.isActive);
        if (withUptime.length === 0) return null;
        return withUptime.reduce((s, v) => s + (v.dailyUptime ?? 0), 0) / withUptime.length;
    })();

    // Find the dominant provider for the marketing hook
    const dominantProvider = providerBreakdown[0] ?? null;

    // Ensure providerBreakdown matches ProviderBreakdownEntry[] exactly
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
                <Header network="Hyperliquid" subtitle="Validator Infrastructure & Decentralization Tracking" />

                <div className="mt-8 mb-10">
                    <AnimatedTagline
                        text={`TRACKING ${activeValidators} ACTIVE VALIDATORS • HYPERLIQUID NETWORK CENTRALIZATION`}
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

                {/* Centralization Hook */}
                {dominantProvider && (
                    <div
                        className="mb-12 relative overflow-hidden rounded-2xl p-8 border"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0, 229, 190, 0.05), rgba(0, 0, 0, 0.4))',
                            borderColor: 'rgba(0, 229, 190, 0.2)',
                        }}
                    >
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1">
                                <div
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4"
                                    style={{
                                        background: 'rgba(0, 229, 190, 0.1)',
                                        border: '1px solid rgba(0, 229, 190, 0.3)',
                                    }}
                                >
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00E5BE' }} />
                                    <span className="text-xs font-medium text-[#00E5BE] tracking-widest uppercase">
                                        Infrastructure Concentration Index
                                    </span>
                                </div>

                                <h2 className="text-3xl font-black text-white mb-4">
                                    {dominantProvider.marketShare.toFixed(1)}%{' '}
                                    <span className="text-[#00E5BE]">{dominantProvider.label} Concentration</span>
                                </h2>

                                <p className="text-gray-400 text-sm leading-relaxed max-w-lg mb-4">
                                    Hyperliquid runs on only {activeValidators} active validators securing{' '}
                                    {totalStakeHYPE} HYPE tokens in stake. Over{' '}
                                    {dominantProvider.marketShare.toFixed(0)}% of the validator set is concentrated
                                    on {dominantProvider.label}, presenting systemic infrastructure risk.
                                </p>

                                <p className="text-gray-600 text-xs mb-6 italic">
                                    Note: provider detection is based on validator name/description matching only —
                                    the Hyperliquid API does not expose IP addresses. Results are best-effort.
                                </p>

                                <a
                                    href="/hyperliquid/decentralize"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all text-black hover:scale-105"
                                    style={{ background: '#00E5BE', boxShadow: '0 0 20px rgba(0, 229, 190, 0.3)' }}
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
                                    Help Decentralize
                                </a>
                            </div>

                            {/* KPI pills */}
                            <div className="flex flex-col gap-3 shrink-0">
                                <div
                                    className="px-6 py-4 rounded-xl border text-center"
                                    style={{
                                        background: 'rgba(0, 229, 190, 0.05)',
                                        borderColor: 'rgba(0, 229, 190, 0.2)',
                                    }}
                                >
                                    <div className="text-2xl font-black text-[#00E5BE]">{activeValidators}</div>
                                    <div className="text-xs text-gray-400 mt-1">Active Validators</div>
                                </div>
                                <div
                                    className="px-6 py-4 rounded-xl border text-center"
                                    style={{
                                        background: ovhValidators > 0
                                            ? 'rgba(0, 240, 255, 0.05)'
                                            : 'rgba(107, 114, 128, 0.05)',
                                        borderColor: ovhValidators > 0
                                            ? 'rgba(0, 240, 255, 0.2)'
                                            : 'rgba(107, 114, 128, 0.2)',
                                    }}
                                >
                                    <div
                                        className="text-2xl font-black"
                                        style={{ color: ovhValidators > 0 ? '#00F0FF' : '#9CA3AF' }}
                                    >
                                        {ovhValidators > 0 ? `${marketShare.toFixed(1)}%` : 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">OVH Market Share</div>
                                </div>

                                <div
                                    className="px-6 py-4 rounded-xl border text-center"
                                    style={{ background: 'rgba(255,200,50,0.05)', borderColor: 'rgba(255,200,50,0.2)' }}
                                >
                                    <div className="text-2xl font-black text-yellow-400">{jailedCount}</div>
                                    <div className="text-xs text-gray-400 mt-1">Jailed Validators</div>
                                </div>

                                {avgUptime !== null && (
                                    <div
                                        className="px-6 py-4 rounded-xl border text-center"
                                        style={{ background: 'rgba(0, 229, 190, 0.05)', borderColor: 'rgba(0, 229, 190, 0.2)' }}
                                    >
                                        <div className="text-2xl font-black text-[#00E5BE]">
                                            {(avgUptime * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">Avg Daily Uptime</div>
                                    </div>
                                )}

                                <div
                                    className="px-6 py-4 rounded-xl border text-center"
                                    style={{ background: 'rgba(0, 229, 190, 0.05)', borderColor: 'rgba(0, 229, 190, 0.2)' }}
                                >
                                    <div className="text-2xl font-black text-[#00E5BE]">{totalStakeHYPE}</div>
                                    <div className="text-xs text-gray-400 mt-1">HYPE Staked</div>
                                </div>
                            </div>
                        </div>

                        {/* Visual accent */}
                        <div
                            className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none"
                            style={{ background: 'radial-gradient(circle at right, #00E5BE 0%, transparent 60%)' }}
                        />
                    </div>
                )}

                {/* Provider breakdown chart */}
                <div className="mt-12 max-w-4xl">
                    <ProviderComparison providerBreakdown={chartData} />
                </div>
            </main>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import ParticlesBackground from '@/components/ParticlesBackground';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import { BNBChainDashboardMetrics, BNBProviderDetail } from '@/types/bnbchain';

const BNB_GOLD = '#F3BA2F';

const TIER_LABELS: Record<string, string> = {
    official: 'Official',
    professional: 'Professional',
    community: 'Community',
};

const TIER_COLORS: Record<string, string> = {
    official: '#F3BA2F',
    professional: '#60A5FA',
    community: '#9CA3AF',
};

const INFRA_COLORS: Record<string, string> = {
    OVHcloud: '#00F0FF',
    AWS: '#FF9900',
    'Google Cloud': '#4285F4',
    Hetzner: '#D50C2D',
    DigitalOcean: '#0080FF',
    Cloudflare: '#F38020',
    Other: '#6B7280',
    Unknown: '#374151',
};

function InfraBadge({ infra, isOnOVH }: { infra: string; isOnOVH: boolean }) {
    const color = isOnOVH ? '#00F0FF' : (INFRA_COLORS[infra] ?? '#6B7280');
    return (
        <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{
                color,
                background: `${color}18`,
                border: `1px solid ${color}40`,
            }}
        >
            {isOnOVH ? 'OVHcloud ✓' : infra}
        </span>
    );
}

function ProviderRow({ detail }: { detail: BNBProviderDetail }) {
    return (
        <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <td className="px-5 py-4">
                <div>
                    <span className="font-semibold text-white text-sm">{detail.providerName}</span>
                    <span className="block text-xs text-white/30 font-mono mt-0.5">{detail.hostname}</span>
                </div>
            </td>
            <td className="px-5 py-4">
                <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                        color: TIER_COLORS[detail.tier] ?? '#9CA3AF',
                        background: `${TIER_COLORS[detail.tier] ?? '#9CA3AF'}15`,
                        border: `1px solid ${TIER_COLORS[detail.tier] ?? '#9CA3AF'}30`,
                    }}
                >
                    {TIER_LABELS[detail.tier] ?? detail.tier}
                </span>
            </td>
            <td className="px-5 py-4 text-center">
                {detail.ipCount > 0 ? (
                    <span className="text-sm text-white/70 font-mono">{detail.ipCount}</span>
                ) : (
                    <span className="text-xs text-white/20">DNS fail</span>
                )}
            </td>
            <td className="px-5 py-4">
                <InfraBadge infra={detail.infrastructure} isOnOVH={detail.isOnOVH} />
            </td>
            <td className="px-5 py-4 text-center">
                {detail.isOnOVH ? (
                    <span className="text-xs font-black" style={{ color: '#00F0FF' }}>✓</span>
                ) : (
                    <span className="text-xs text-white/15">—</span>
                )}
            </td>
        </tr>
    );
}

export default function BNBChainNodesPage() {
    const [metrics, setMetrics] = useState<BNBChainDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/bnbchain');
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
            <div className="min-h-screen relative" style={{ background: '#0a0800' }}>
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

    const details: BNBProviderDetail[] = (metrics.providerDetails ?? [])
        .sort((a, b) => {
            // OVH first, then by tier (official > professional > community), then by ipCount
            if (a.isOnOVH !== b.isOnOVH) return a.isOnOVH ? -1 : 1;
            const tierOrder = { official: 0, professional: 1, community: 2 };
            const tierDiff = (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3);
            if (tierDiff !== 0) return tierDiff;
            return b.ipCount - a.ipCount;
        });

    const ovhProviders = details.filter(d => d.isOnOVH);

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{ background: '#0a0800' }}
        >
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12 max-w-5xl">
                <div className="mb-8">
                    <h2
                        className="text-3xl font-bold bg-clip-text text-transparent"
                        style={{ backgroundImage: `linear-gradient(to right, ${BNB_GOLD}, #FFD97D)` }}
                    >
                        BNB Chain — RPC Provider Explorer
                    </h2>
                    <p className="text-white/50 mt-2 text-sm">
                        {details.length} professional RPC providers tracked · ~{metrics.coverage.estimatedTrafficCoverage}% of BSC API traffic.
                        Infrastructure detected via ASN/MaxMind per resolved IP.
                    </p>
                </div>

                {/* Summary pills */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <div
                        className="px-5 py-3 rounded-xl border text-center"
                        style={{ background: 'rgba(243, 186, 47, 0.06)', borderColor: 'rgba(243, 186, 47, 0.2)' }}
                    >
                        <div className="text-2xl font-black" style={{ color: BNB_GOLD }}>
                            {details.length}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">Providers Tracked</div>
                    </div>
                    <div
                        className="px-5 py-3 rounded-xl border text-center"
                        style={{ background: 'rgba(243, 186, 47, 0.06)', borderColor: 'rgba(243, 186, 47, 0.2)' }}
                    >
                        <div className="text-2xl font-black" style={{ color: BNB_GOLD }}>
                            {metrics.totalTrackedEndpoints}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">IPs Resolved</div>
                    </div>
                    <div
                        className="px-5 py-3 rounded-xl border text-center"
                        style={{ background: 'rgba(0, 240, 255, 0.06)', borderColor: 'rgba(0, 240, 255, 0.2)' }}
                    >
                        <div className="text-2xl font-black" style={{ color: '#00F0FF' }}>
                            {ovhProviders.length > 0 ? ovhProviders.length : '0'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">On OVHcloud</div>
                    </div>
                    <div
                        className="px-5 py-3 rounded-xl border text-center"
                        style={{ background: 'rgba(243, 186, 47, 0.06)', borderColor: 'rgba(243, 186, 47, 0.2)' }}
                    >
                        <div className="text-2xl font-black" style={{ color: BNB_GOLD }}>
                            {metrics.marketShare.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">OVH Share</div>
                    </div>
                </div>

                {/* Scope note */}
                <div
                    className="mb-6 px-4 py-3 rounded-xl border text-xs text-white/40"
                    style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                >
                    Scope: professional RPC providers only. Validators (~{metrics.totalValidators}) and private nodes
                    (~{metrics.coverage.totalNetworkEstimate.toLocaleString()}+) use private sentries — IPs not discoverable on BSC.
                </div>

                {/* Provider table */}
                {details.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-white/8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/8 bg-white/[0.02]">
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">
                                        RPC Provider
                                    </th>
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">
                                        Tier
                                    </th>
                                    <th className="px-5 py-3 text-center text-[9px] font-black uppercase tracking-widest text-white/30">
                                        IPs
                                    </th>
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">
                                        Infrastructure
                                    </th>
                                    <th className="px-5 py-3 text-center text-[9px] font-black uppercase tracking-widest text-white/30">
                                        OVH
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.map((d) => (
                                    <ProviderRow key={d.hostname} detail={d} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div
                        className="rounded-2xl p-12 border text-center"
                        style={{ background: 'rgba(243, 186, 47, 0.04)', borderColor: 'rgba(243, 186, 47, 0.15)' }}
                    >
                        <p className="text-white/40 text-sm">No provider data yet — run the worker to populate.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

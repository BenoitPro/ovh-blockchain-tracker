'use client';

import { useEffect, useState } from 'react';
import ParticlesBackground from '@/components/ParticlesBackground';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import { BNBChainDashboardMetrics, BNBChainOVHNode } from '@/types/bnbchain';

const BNB_GOLD = '#F3BA2F';

function NodeRow({ node }: { node: BNBChainOVHNode }) {
    return (
        <tr className="border-b border-white/5 hover:bg-white/2 transition-colors">
            <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-white/70">{node.ip}</span>
                    {node.port && (
                        <span className="text-[10px] text-white/30">:{node.port}</span>
                    )}
                </div>
            </td>
            <td className="px-5 py-4">
                <span
                    className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{
                        color: BNB_GOLD,
                        background: 'rgba(243, 186, 47, 0.1)',
                        border: '1px solid rgba(243, 186, 47, 0.25)',
                    }}
                >
                    {node.provider}
                </span>
            </td>
            <td className="px-5 py-4 text-white/50 text-xs">
                {node.ipInfo?.country_name || node.ipInfo?.country || '—'}
            </td>
            <td className="px-5 py-4 text-white/50 text-xs">
                {node.ipInfo?.asn || '—'}
            </td>
            <td className="px-5 py-4 text-white/40 text-xs font-mono truncate max-w-[200px]">
                {node.version || '—'}
            </td>
            <td className="px-5 py-4 text-center">
                {node.isValidator ? (
                    <span
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{
                            color: BNB_GOLD,
                            background: 'rgba(243, 186, 47, 0.12)',
                            border: '1px solid rgba(243, 186, 47, 0.3)',
                        }}
                    >
                        Validator
                    </span>
                ) : (
                    <span className="text-[10px] text-white/20">Full node</span>
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

    const nodes: BNBChainOVHNode[] = metrics.topNodes ?? [];

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{ background: '#0a0800' }}
        >
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2
                        className="text-3xl font-bold bg-clip-text text-transparent"
                        style={{
                            backgroundImage: `linear-gradient(to right, ${BNB_GOLD}, #FFD97D)`,
                        }}
                    >
                        BNB Chain — OVHcloud Nodes
                    </h2>
                    <p className="text-white/50 mt-2">
                        {nodes.length > 0
                            ? `${nodes.length} OVH-hosted endpoint${nodes.length !== 1 ? 's' : ''} out of ${metrics.totalTrackedEndpoints.toLocaleString()} tracked RPC endpoints.`
                            : `No OVHcloud endpoints detected among the ${metrics.totalTrackedEndpoints.toLocaleString()} tracked BSC RPC endpoints.`}
                    </p>
                </div>

                {/* Summary pills */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <div
                        className="px-5 py-3 rounded-xl border text-center"
                        style={{
                            background: 'rgba(243, 186, 47, 0.06)',
                            borderColor: 'rgba(243, 186, 47, 0.2)',
                        }}
                    >
                        <div className="text-2xl font-black" style={{ color: BNB_GOLD }}>
                            {metrics.totalTrackedEndpoints.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">Tracked Endpoints</div>
                    </div>
                    <div
                        className="px-5 py-3 rounded-xl border text-center"
                        style={{
                            background: 'rgba(243, 186, 47, 0.06)',
                            borderColor: 'rgba(243, 186, 47, 0.2)',
                        }}
                    >
                        <div className="text-2xl font-black" style={{ color: BNB_GOLD }}>
                            {metrics.ovhEndpoints}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">OVH Endpoints</div>
                    </div>
                    <div
                        className="px-5 py-3 rounded-xl border text-center"
                        style={{
                            background: 'rgba(243, 186, 47, 0.06)',
                            borderColor: 'rgba(243, 186, 47, 0.2)',
                        }}
                    >
                        <div className="text-2xl font-black" style={{ color: BNB_GOLD }}>
                            {metrics.marketShare.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">Market Share</div>
                    </div>
                    <div
                        className="px-5 py-3 rounded-xl border text-center"
                        style={{
                            background: 'rgba(243, 186, 47, 0.06)',
                            borderColor: 'rgba(243, 186, 47, 0.2)',
                        }}
                    >
                        <div className="text-2xl font-black" style={{ color: BNB_GOLD }}>
                            {metrics.ovhProviders}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">OVH Providers</div>
                    </div>
                </div>

                {nodes.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-white/8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/8 bg-white/2">
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">
                                        IP Address
                                    </th>
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">
                                        Provider
                                    </th>
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">
                                        Country
                                    </th>
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">
                                        ASN
                                    </th>
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">
                                        Client Version
                                    </th>
                                    <th className="px-5 py-3 text-center text-[9px] font-black uppercase tracking-widest text-white/30">
                                        Role
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {nodes.map((node) => (
                                    <NodeRow key={node.ip} node={node} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div
                        className="rounded-2xl p-12 border text-center"
                        style={{
                            background: 'rgba(243, 186, 47, 0.04)',
                            borderColor: 'rgba(243, 186, 47, 0.15)',
                        }}
                    >
                        <p className="text-white/40 text-sm">
                            No OVHcloud nodes detected in the current BNB Chain peer snapshot.
                        </p>
                        <p className="text-white/20 text-xs mt-2">
                            The worker may need to run again to discover updated peers.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

import ParticlesBackground from '@/components/ParticlesBackground';
import { readChainCache } from '@/lib/cache/chain-storage';
import { TronDashboardMetrics } from '@/types/tron';

export const dynamic = 'force-dynamic';

const TRON_RED = '#FF060A';

export default async function TronNodesPage() {
    let metrics: TronDashboardMetrics | null = null;

    try {
        const cache = await readChainCache<TronDashboardMetrics>('tron');
        if (cache?.data) {
            metrics = cache.data;
        }
    } catch {
        // Fallback silently — handled below
    }

    return (
        <div className="min-h-screen relative overflow-hidden tron-theme" style={{ background: '#0a0000' }}>
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <h2
                        className="text-3xl font-bold bg-clip-text text-transparent"
                        style={{ backgroundImage: `linear-gradient(to right, ${TRON_RED}, #ff6b6b)` }}
                    >
                        TRON Network Explorer
                    </h2>
                    <p className="text-white/50 mt-2 text-sm">
                        OVHcloud-hosted nodes detected on the TRON P2P network
                    </p>
                </div>

                {/* KPI summary */}
                {metrics && (
                    <div className="flex flex-wrap gap-4 mb-10">
                        <div
                            className="px-5 py-3 rounded-xl border text-sm font-mono"
                            style={{ borderColor: `${TRON_RED}30`, background: `${TRON_RED}08` }}
                        >
                            <span className="text-white/40 mr-2">Total nodes</span>
                            <span className="font-bold text-white">{metrics.totalNodes.toLocaleString()}</span>
                        </div>
                        <div
                            className="px-5 py-3 rounded-xl border text-sm font-mono"
                            style={{ borderColor: `${TRON_RED}30`, background: `${TRON_RED}08` }}
                        >
                            <span className="text-white/40 mr-2">OVH nodes</span>
                            <span className="font-bold" style={{ color: TRON_RED }}>{metrics.ovhNodes.toLocaleString()}</span>
                        </div>
                        <div
                            className="px-5 py-3 rounded-xl border text-sm font-mono"
                            style={{ borderColor: `${TRON_RED}30`, background: `${TRON_RED}08` }}
                        >
                            <span className="text-white/40 mr-2">Market share</span>
                            <span className="font-bold" style={{ color: TRON_RED }}>{metrics.marketShare.toFixed(2)}%</span>
                        </div>
                    </div>
                )}

                {/* Node table */}
                {!metrics ? (
                    <div className="text-center py-24 text-white/30 text-sm">
                        No data available — trigger{' '}
                        <code className="font-mono text-white/50">/api/cron/tron-refresh</code> first.
                    </div>
                ) : metrics.topValidators.length === 0 ? (
                    <div className="text-center py-24 text-white/30 text-sm">
                        No OVH-hosted nodes detected in the current snapshot.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/30 text-[10px] uppercase tracking-widest">
                                    <th className="px-5 py-4 text-left font-bold">#</th>
                                    <th className="px-5 py-4 text-left font-bold">IP Address</th>
                                    <th className="px-5 py-4 text-left font-bold">Port</th>
                                    <th className="px-5 py-4 text-left font-bold">Country</th>
                                    <th className="px-5 py-4 text-left font-bold">Provider</th>
                                    <th className="px-5 py-4 text-left font-bold">ASN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.topValidators.map((node, i) => (
                                    <tr
                                        key={node.ip}
                                        className="border-b border-white/5 hover:bg-white/3 transition-colors"
                                    >
                                        <td className="px-5 py-3.5 text-white/20 font-mono text-xs">{i + 1}</td>
                                        <td className="px-5 py-3.5 font-mono text-white/80">{node.ip}</td>
                                        <td className="px-5 py-3.5 font-mono text-white/40">{node.port}</td>
                                        <td className="px-5 py-3.5 text-white/60">{node.ipInfo.country_name}</td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                style={{ color: TRON_RED, background: `${TRON_RED}18` }}
                                            >
                                                {node.provider || 'OVHcloud'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-white/30 text-xs">{node.ipInfo.asn}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

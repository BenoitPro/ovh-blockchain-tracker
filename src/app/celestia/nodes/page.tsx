import ParticlesBackground from '@/components/ParticlesBackground';
import { readChainCache } from '@/lib/cache/chain-storage';
import { CelestiaNodeMetrics, CelestiaOVHNode } from '@/types';
import { ServerIcon } from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

const ACCENT = '#7B2FBE';

const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    return String.fromCodePoint(...countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
};

export default async function CelestiaNodesPage() {
    let nodes: CelestiaOVHNode[] = [];
    let totalPeers = 0;

    try {
        const cache = await readChainCache<CelestiaNodeMetrics>('celestia');
        if (cache?.data) {
            nodes = cache.data.topNodes ?? [];
            totalPeers = cache.data.totalPeers ?? 0;
        }
    } catch { /* silent fallback */ }

    return (
        <div className="min-h-screen relative overflow-hidden celestia-theme" style={{ background: '#080414' }}>
            <ParticlesBackground />
            <main className="relative z-10 container mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold" style={{ color: ACCENT }}>
                        Celestia OVH Nodes
                    </h2>
                    <p className="text-white/50 mt-2">
                        {nodes.length > 0
                            ? `${nodes.length} OVH-hosted nodes detected out of ${totalPeers} tracked peers`
                            : 'No data available yet — run the worker first'}
                    </p>
                </div>

                {nodes.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 p-12 text-center">
                        <ServerIcon className="h-12 w-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">Node data not yet available.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {nodes.map((node, idx) => (
                            <div
                                key={`${node.ip}-${idx}`}
                                className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 rounded-xl border items-center"
                                style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.06)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-white/30 text-xs">{idx + 1}</span>
                                    <code className="text-sm font-mono" style={{ color: ACCENT }}>{node.ip}</code>
                                </div>
                                <div>
                                    <p className="text-white/70 text-sm">{node.ipInfo.org}</p>
                                    <p className="text-xs text-white/30">{node.ipInfo.asn}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl" title={node.ipInfo.country_name}>
                                        {getFlagEmoji(node.ipInfo.country)}
                                    </span>
                                    <div>
                                        <p className="text-white/70 text-sm">{node.ipInfo.country_name}</p>
                                        <p className="text-xs text-white/30">{node.ipInfo.city}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/30">Port {node.port}</p>
                                    {node.version && <p className="text-xs text-white/20">{node.version}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

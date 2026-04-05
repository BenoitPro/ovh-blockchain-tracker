import ParticlesBackground from '@/components/ParticlesBackground';
import AvalancheNodeExplorer from '@/components/nodes/AvalancheNodeExplorer';
import { readChainCache } from '@/lib/cache/chain-storage';
import { AvalancheDashboardMetrics } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AvalancheNodesExplorerPage() {
    let nodeCount = 0;

    try {
        const cache = await readChainCache<AvalancheDashboardMetrics>('avalanche');
        if (cache?.data) {
            nodeCount = cache.data.totalNodes || 0;
        }
    } catch {
        // Fallback silently to client-side data
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050510] avalanche-theme">
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-[#E84142] to-[#FF6B6B] bg-clip-text text-transparent">
                        Avalanche Network Explorer
                    </h2>
                    <p className="text-white/50 mt-2">
                        Real-time visualization of{nodeCount > 0 ? ` all ${nodeCount.toLocaleString()}` : ' active'} validators contributing to the Avalanche Primary Network.
                    </p>
                </div>

                <AvalancheNodeExplorer />
            </main>
        </div>
    );
}

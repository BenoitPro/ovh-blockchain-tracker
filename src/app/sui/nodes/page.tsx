import ParticlesBackground from '@/components/ParticlesBackground';
import SuiNodeExplorer from '@/components/nodes/SuiNodeExplorer';
import { readChainCache } from '@/lib/cache/chain-storage';
import { SuiDashboardMetrics } from '@/types/sui';

// Performance optimized: stats from SSR cache, nodes from Client API
export const dynamic = 'force-dynamic';

export default async function SuiNodesExplorerPage() {
    let nodeCount = 0;

    try {
        const cache = await readChainCache<SuiDashboardMetrics>('sui');
        if (cache?.data) {
            nodeCount = cache.data.totalNodes || 0;
        }
    } catch (err) {
        // Fallback silently to client-side data
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050510] sui-theme">
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-[#4DA2FF] to-[#00F0FF] bg-clip-text text-transparent">
                        Sui Network Explorer
                    </h2>
                    <p className="text-white/50 mt-2">
                        Real-time visualization of all {nodeCount > 0 ? nodeCount.toLocaleString() : 'active'} validators contributing to the Sui Mainnet governance.
                    </p>
                </div>

                <SuiNodeExplorer />
            </main>
        </div>
    );
}

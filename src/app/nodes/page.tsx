import ParticlesBackground from '@/components/ParticlesBackground';
import NodeExplorer from '@/components/nodes/NodeExplorer';
import { readCache } from '@/lib/cache/storage';

// Force dynamic to get fresh metrics but from cache
export const dynamic = 'force-dynamic';

export default async function NodesPage() {
    let totalNodes = 0;
    
    // Get stats from already cached metrics (very fast, no RPC call)
    try {
        const cache = await readCache();
        if (cache?.data) {
            totalNodes = cache.nodeCount || 0;
        }
    } catch (err) {
        // Fallback silently
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050510]">
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#00F0FF] to-[#6B4FBB] bg-clip-text text-transparent">
                            Network Explorer
                        </h2>
                        <p className="text-white/50 mt-2">
                            Explore all {totalNodes > 0 ? totalNodes.toLocaleString() : 'thousands of'} nodes currently contributing to the Solana network.
                        </p>
                    </div>

                    <NodeExplorer />
            </main>
        </div>
    );
}

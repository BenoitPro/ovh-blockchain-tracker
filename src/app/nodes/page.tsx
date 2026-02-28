import Header from '@/components/dashboard/Header';
import Footer from '@/components/dashboard/Footer';
import BlockchainCubes from '@/components/BlockchainCubes';
import NodeExplorer from '@/components/nodes/NodeExplorer';
import { fetchEnrichedNodes } from '@/lib/solana/getAllNodes';
import { EnrichedNode } from '@/types';

// Mark as dynamic to avoid build-time MaxMind issues and ensure fresh data
export const dynamic = 'force-dynamic';

export default async function NodesPage() {
    let nodes: EnrichedNode[] = [];
    let error = null;

    try {
        nodes = await fetchEnrichedNodes();
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to fetch nodes';
    }

    return (
        <div className="min-h-screen relative">
            <BlockchainCubes />

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                <main className="flex-grow container mx-auto px-6 py-12">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#00F0FF] to-[#6B4FBB] bg-clip-text text-transparent">
                            Network Explorer
                        </h2>
                        <p className="text-white/50 mt-2">
                            Explore all {nodes.length} nodes currently contributing to the Solana network.
                        </p>
                    </div>

                    {error ? (
                        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
                            <p className="text-red-400">Error loading nodes: {error}</p>
                        </div>
                    ) : (
                        <NodeExplorer initialNodes={nodes} />
                    )}
                </main>

                <Footer />
            </div>
        </div>
    );
}

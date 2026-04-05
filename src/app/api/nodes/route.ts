import { NextRequest, NextResponse } from 'next/server';
import { fetchEnrichedNodes } from '@/lib/solana/getAllNodes';
import { logger } from '@/lib/utils';

// Persistent cache across HMR reloads in development
const globalForNodes = globalThis as unknown as {
    memoizedNodes: any[] | undefined;
    lastFetchTime: number;
    inflightFetch: Promise<any[]> | undefined;
};

const CACHE_TTL = 300 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const refresh = searchParams.get('refresh') === 'true';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search')?.toLowerCase() || '';

        // Refresh cache if stale OR requested via query param
        if (refresh || !globalForNodes.memoizedNodes || (Date.now() - (globalForNodes.lastFetchTime || 0) > CACHE_TTL)) {
            // Deduplicate concurrent fetches: if one is already in-flight, reuse it
            if (!globalForNodes.inflightFetch) {
                logger.info('[API:Nodes] Fetching fresh nodes from RPC (Refresh forced or cached stale)');
                globalForNodes.inflightFetch = fetchEnrichedNodes().then(nodes => {
                    globalForNodes.memoizedNodes = nodes;
                    globalForNodes.lastFetchTime = Date.now();
                    globalForNodes.inflightFetch = undefined;
                    return nodes;
                }).catch(err => {
                    globalForNodes.inflightFetch = undefined;
                    throw err;
                });
            } else {
                logger.info('[API:Nodes] Reusing in-flight fetch (concurrent request)');
            }
            await globalForNodes.inflightFetch;
        }

        let filtered = globalForNodes.memoizedNodes || [];

        // Apply search if provided
        if (search) {
            filtered = filtered.filter(node => 
                node.pubkey.toLowerCase().includes(search) ||
                node.name?.toLowerCase().includes(search) ||
                node.ip?.toLowerCase().includes(search) ||
                node.org?.toLowerCase().includes(search)
            );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const pagedNodes = filtered.slice(startIndex, endIndex);

        return NextResponse.json({
            success: true,
            total: filtered.length,
            page,
            limit,
            nodes: pagedNodes
        });
    } catch (error) {
        logger.error('[API:Nodes] Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch nodes' }, { status: 500 });
    }
}

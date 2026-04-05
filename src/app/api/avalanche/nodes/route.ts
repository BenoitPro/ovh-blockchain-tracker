import { NextResponse } from 'next/server';
import { fetchEnrichedAvalancheNodes } from '@/lib/avalanche/getAllNodes';
import { logger } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search')?.toLowerCase() || '';

        const allNodes = await fetchEnrichedAvalancheNodes();

        let filtered = allNodes;
        if (search) {
            filtered = allNodes.filter(n =>
                n.nodeID.toLowerCase().includes(search) ||
                (n.ipInfo?.ip || '').toLowerCase().includes(search) ||
                (n.provider || '').toLowerCase().includes(search) ||
                (n.ipInfo?.country_name || '').toLowerCase().includes(search) ||
                (n.version || '').toLowerCase().includes(search)
            );
        }

        const total = filtered.length;
        const start = (page - 1) * limit;
        const nodes = filtered.slice(start, start + limit);

        return NextResponse.json({ success: true, total, page, limit, nodes });
    } catch (error) {
        logger.error('[API/avalanche/nodes] Fetch failed:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch nodes' }, { status: 500 });
    }
}

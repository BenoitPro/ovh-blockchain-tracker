import { NextResponse } from 'next/server';
import { fetchEnrichedSuiNodes } from '@/lib/sui/getAllNodes';
import { logger } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search')?.toLowerCase() || '';

        // For Sui, we fetch all and filter in memory for now as the count is small (~100-200)
        // But we provide a paginated API to keep the component pattern efficient
        const allNodes = await fetchEnrichedSuiNodes();
        
        let filtered = allNodes;
        if (search) {
            filtered = allNodes.filter(n => 
                (n.name || '').toLowerCase().includes(search) ||
                n.suiAddress.toLowerCase().includes(search) ||
                (n.ip || '').toLowerCase().includes(search) ||
                (n.provider || '').toLowerCase().includes(search)
            );
        }

        const total = filtered.length;
        const start = (page - 1) * limit;
        const nodes = filtered.slice(start, start + limit);

        return NextResponse.json({
            success: true,
            total,
            page,
            limit,
            nodes
        });
    } catch (error) {
        logger.error('[API/sui/nodes] Fetch failed:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch nodes' }, { status: 500 });
    }
}

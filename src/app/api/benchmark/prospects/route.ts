import { NextResponse } from 'next/server';
import { readChainCache } from '@/lib/cache/chain-storage';
import { logger } from '@/lib/utils';
import type { ProspectEntry } from '@/types/dashboard';
import type { SuiDashboardMetrics } from '@/types/sui';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [solanaProspectsCache, suiCache] = await Promise.all([
            readChainCache<{ topProspects: ProspectEntry[] }>('solana-prospects'),
            readChainCache<SuiDashboardMetrics>('sui'),
        ]);

        const chains: Array<{ id: string; name: string; prospects: ProspectEntry[] }> = [];

        if (solanaProspectsCache?.data.topProspects?.length) {
            chains.push({
                id: 'solana',
                name: 'Solana',
                prospects: solanaProspectsCache.data.topProspects,
            });
        }

        if (suiCache?.data.topProspects?.length) {
            chains.push({
                id: 'sui',
                name: 'Sui',
                prospects: suiCache.data.topProspects,
            });
        }

        return NextResponse.json({ success: true, chains });
    } catch (error) {
        logger.error('[benchmark/prospects] Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to load prospects' }, { status: 500 });
    }
}

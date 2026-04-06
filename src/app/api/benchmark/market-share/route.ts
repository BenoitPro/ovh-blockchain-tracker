import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { getDatabase } from '@/lib/db/database';
import { aggregateProviderBreakdowns } from '@/lib/benchmark/aggregateMarketShare';
import { logger } from '@/lib/utils';
import type { DashboardMetrics, ProviderBreakdownEntry } from '@/types/dashboard';
import type { AvalancheDashboardMetrics } from '@/types/avalanche';
import type { SuiDashboardMetrics } from '@/types/sui';
import type { TronDashboardMetrics } from '@/types/tron';

const CHAIN_COLORS: Record<string, string> = {
    solana:    '#9945FF',
    ethereum:  '#627EEA',
    avalanche: '#E84142',
    sui:       '#4DA2FF',
    tron:      '#FF060A',
};

export const dynamic = 'force-dynamic';

interface ChainEntry {
    id: string;
    name: string;
    color: string;
    totalNodes: number;
    providerBreakdown: ProviderBreakdownEntry[];
    stale: boolean;
}

async function fetchEthereumBreakdown(): Promise<ChainEntry | null> {
    try {
        const db = getDatabase();
        const result = await db.execute(
            `SELECT total_nodes, provider_breakdown FROM ethereum_snapshots ORDER BY timestamp DESC LIMIT 1`
        );
        if (!result.rows.length) return null;
        const row = result.rows[0];
        return {
            id: 'ethereum',
            name: 'Ethereum',
            color: CHAIN_COLORS.ethereum,
            totalNodes: row.total_nodes as number,
            providerBreakdown: JSON.parse(row.provider_breakdown as string),
            stale: false,
        };
    } catch {
        logger.warn('[benchmark/market-share] Could not read Ethereum snapshot');
        return null;
    }
}

async function fetchCacheBreakdown<T extends { totalNodes: number; providerBreakdown?: ProviderBreakdownEntry[] }>(
    chainId: Parameters<typeof readChainCache>[0],
    displayId: string,
    displayName: string,
): Promise<ChainEntry | null> {
    const entry = await readChainCache<T>(chainId);
    if (!entry || !entry.data.providerBreakdown) return null;
    const fresh = isChainCacheFresh(entry, chainId);
    return {
        id: displayId,
        name: displayName,
        color: CHAIN_COLORS[displayId] ?? '#6B7280',
        totalNodes: entry.data.totalNodes,
        providerBreakdown: entry.data.providerBreakdown,
        stale: !fresh,
    };
}

export async function GET() {
    try {
        const [solana, ethereum, avalanche, sui, tron] = await Promise.all([
            fetchCacheBreakdown<DashboardMetrics>('solana', 'solana', 'Solana'),
            fetchEthereumBreakdown(),
            fetchCacheBreakdown<AvalancheDashboardMetrics>('avalanche', 'avalanche', 'Avalanche'),
            fetchCacheBreakdown<SuiDashboardMetrics>('sui', 'sui', 'Sui'),
            fetchCacheBreakdown<TronDashboardMetrics>('tron', 'tron', 'Tron'),
        ]);

        const chains = [solana, ethereum, avalanche, sui, tron].filter(Boolean) as ChainEntry[];
        const aggregate = {
            totalNodes: chains.reduce((s, c) => s + c.totalNodes, 0),
            providerBreakdown: aggregateProviderBreakdowns(chains),
        };

        return NextResponse.json({ success: true, chains, aggregate });
    } catch (error) {
        logger.error('[benchmark/market-share] Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to aggregate market share' }, { status: 500 });
    }
}

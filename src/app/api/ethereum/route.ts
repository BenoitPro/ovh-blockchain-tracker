import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/database';
import { EthAPIResponse, EthSnapshotMetrics } from '@/types';
import { logger } from '@/lib/utils';

export async function GET() {
    try {
        const db = getDatabase();

        // Fetch the most recent snapshot
        const result = await db.execute(
            `SELECT * FROM ethereum_snapshots ORDER BY timestamp DESC LIMIT 1`
        );

        if (!result.rows || result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No Ethereum snapshot available. Run the crawl + processing script first.' },
                { status: 404 }
            );
        }

        const row = result.rows[0];

        const data: EthSnapshotMetrics = {
            totalNodes: row.total_nodes as number,
            timestamp: row.timestamp as number,
            crawlDurationMin: row.crawl_duration_min as number | undefined,
            providerDistribution: JSON.parse(row.provider_distribution as string),
            providerBreakdown: JSON.parse(row.provider_breakdown as string),
            geoDistribution: JSON.parse(row.geo_distribution as string),
        };

        const response: EthAPIResponse = {
            success: true,
            data,
            timestamp: row.created_at as number,
        };

        return NextResponse.json(response);
    } catch (error) {
        logger.error('[API/ethereum] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

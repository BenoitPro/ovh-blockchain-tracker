import { NextResponse } from 'next/server';
import { runEthRefresh } from '@/lib/ethereum/fetchMigalabs';
import { logger } from '@/lib/utils/logger';
import { getEnvConfig } from '@/lib/config/env';

/**
 * Vercel Cron Job — Ethereum consensus layer node distribution refresh
 *
 * Fetches hosting & geo distribution from MigaLabs API and saves a snapshot
 * to the Turso database.
 *
 * Schedule: 06:00 and 18:00 UTC daily (configured in vercel.json)
 * Source: MigaLabs API (consensus-layer-nodes/hosting_type)
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const startTime = Date.now();
    const env = getEnvConfig();

    // Verify request is from Vercel Cron (in production)
    const authHeader = request.headers.get('authorization');
    if (env.cronSecret && authHeader !== `Bearer ${env.cronSecret}`) {
        logger.warn('[Cron/ETH] Unauthorized access attempt');
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('[Cron/ETH] Starting Ethereum data refresh…');
    logger.info(`[Cron/ETH] Timestamp: ${new Date().toISOString()}`);

    try {
        const result = await runEthRefresh();

        const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`[Cron/ETH] Completed in ${durationSec}s`);

        return NextResponse.json({
            success: true,
            message: 'Ethereum snapshot refreshed',
            stats: {
                totalNodes: result.totalNodes,
                ovhNodes: result.ovhNodes,
                ovhMarketShare: result.ovhSharePct.toFixed(2) + '%',
                processingTimeSeconds: parseFloat(durationSec),
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        logger.error('[Cron/ETH] Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils';
import { getEnvConfig } from '@/lib/config/env';

/**
 * Factory for cron route handlers.
 *
 * Handles the boilerplate shared across all chain refresh endpoints:
 *   - CRON_SECRET auth check
 *   - Request timing
 *   - Structured success / error JSON response
 *
 * Usage:
 *   export const GET = createCronHandler('AVAX', async () => {
 *     // chain-specific logic
 *     return { totalNodes: 123, ovhNodes: 4, marketShare: '3.25%' };
 *   });
 *   export const maxDuration = 60;
 *   export const dynamic = 'force-dynamic';
 */
export function createCronHandler(
    prefix: string,
    refreshFn: () => Promise<Record<string, unknown>>,
) {
    return async function GET(request: Request): Promise<NextResponse> {
        const startTime = Date.now();
        const env = getEnvConfig();

        const authHeader = request.headers.get('authorization');
        if (env.cronSecret && authHeader !== `Bearer ${env.cronSecret}`) {
            logger.warn(`[Cron/${prefix}] Unauthorized access attempt`);
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        logger.info(`[Cron/${prefix}] Starting refresh…`);
        logger.info(`[Cron/${prefix}] Timestamp: ${new Date().toISOString()}`);

        try {
            const stats = await refreshFn();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            logger.info(`[Cron/${prefix}] Completed in ${duration}s`);

            return NextResponse.json({
                success: true,
                stats: {
                    ...stats,
                    processingTimeSeconds: parseFloat(duration),
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            logger.error(`[Cron/${prefix}] Error:`, error);
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                },
                { status: 500 },
            );
        }
    };
}

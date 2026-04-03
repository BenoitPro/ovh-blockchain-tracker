import { NextResponse } from 'next/server';
import { fetchAvalanchePeers } from '@/lib/avalanche/fetchPeers';
import { filterOVHAvalancheNodes, categorizeAvalancheNodesByProvider } from '@/lib/avalanche/filterOVH';
import { calculateAvalancheMetrics } from '@/lib/avalanche/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { initMaxMind } from '@/lib/asn/maxmind';
import { logger } from '@/lib/utils/logger';
import { getEnvConfig } from '@/lib/config/env';

/**
 * GET /api/cron/avax-refresh
 *
 * Cron / worker endpoint — fetches Avalanche peers, runs MaxMind ASN analysis,
 * and writes the result to the shared `cache` table under key `avalanche-metrics`.
 *
 * Security: protected by the same CRON_SECRET as the Solana refresh endpoint.
 *
 * PM2: add an `ovh-avax-worker` app in ecosystem.config.js (see below).
 * Vercel: add a cron entry in vercel.json if hosted on Vercel.
 *
 * Recommended cadence: every 2 hours (Avalanche peers are fairly stable).
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const startTime = Date.now();
    const env = getEnvConfig();

    const authHeader = request.headers.get('authorization');
    if (env.cronSecret && authHeader !== `Bearer ${env.cronSecret}`) {
        logger.warn('[Cron/AVAX] Unauthorized access attempt');
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('🔺 [Cron/AVAX] Starting Avalanche data refresh...');

    try {
        // 1. MaxMind (offline DB — shared with Solana/Eth)
        logger.info('📦 [Cron/AVAX] Initializing MaxMind...');
        await initMaxMind();

        // 2. Fetch peers from api.avax.network
        logger.info('📡 [Cron/AVAX] Fetching Avalanche peers...');
        const allNodes = await fetchAvalanchePeers();

        if (!allNodes.length) {
            throw new Error('[Cron/AVAX] No peers returned from api.avax.network');
        }

        logger.info(`✅ [Cron/AVAX] Fetched ${allNodes.length} peers`);

        // 3. Categorize by provider
        logger.info('🔍 [Cron/AVAX] Categorizing by provider...');
        const providerCategorization = await categorizeAvalancheNodesByProvider(allNodes);

        // 4. Filter OVH nodes
        logger.info('🔎 [Cron/AVAX] Filtering OVH nodes...');
        const ovhNodes = await filterOVHAvalancheNodes(allNodes);

        logger.info(
            `✅ [Cron/AVAX] Found ${ovhNodes.length} OVH nodes (${((ovhNodes.length / allNodes.length) * 100).toFixed(2)}%)`,
        );

        // 5. Calculate metrics
        logger.info('📈 [Cron/AVAX] Calculating metrics...');
        const metrics = calculateAvalancheMetrics(allNodes, ovhNodes, providerCategorization);

        // 6. Write to cache (key: 'avalanche-metrics' — isolated from Solana)
        logger.info('💾 [Cron/AVAX] Writing to cache...');
        await writeChainCache('avalanche', metrics, allNodes.length);

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`✅ [Cron/AVAX] Done in ${totalTime}s`);

        return NextResponse.json({
            success: true,
            message: 'Avalanche data refreshed successfully',
            stats: {
                totalPeers: allNodes.length,
                ovhNodes: ovhNodes.length,
                marketShare: metrics.marketShare.toFixed(2) + '%',
                avgOVHUptime: metrics.avgOVHUptime?.toFixed(1) + '%',
                processingTimeSeconds: parseFloat(totalTime),
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        logger.error('❌ [Cron/AVAX] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 },
        );
    }
}

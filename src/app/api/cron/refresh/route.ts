import { NextResponse } from 'next/server';
import { fetchSolanaNodes } from '@/lib/solana/fetchNodes';
import { filterOVHNodes, categorizeNodesByProvider } from '@/lib/solana/filterOVH';
import { calculateMetrics } from '@/lib/solana/calculateMetrics';
import { writeCache } from '@/lib/cache/storage';
import { initMaxMind } from '@/lib/asn/maxmind';
import { MetricsRepository } from '@/lib/db/metrics-repository';

/**
 * Vercel Cron Job Endpoint for refreshing Solana node data
 * 
 * This endpoint is called automatically by Vercel Cron every day.
 * It fetches all Solana nodes, analyzes OVH infrastructure using MaxMind,
 * and caches the results for fast API responses + saves history.
 * 
 * Schedule: Every day at 00:00 (configured in vercel.json)
 */
export const maxDuration = 60; // Allow up to 60 seconds for this function
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const startTime = Date.now();

    // Verify the request is from Vercel Cron (in production)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('[Cron] Unauthorized access attempt');
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    console.log('🚀 [Cron] Starting Solana data refresh...');
    console.log(`⏰ [Cron] Timestamp: ${new Date().toISOString()}`);

    try {
        // Step 1: Initialize MaxMind
        console.log('📦 [Cron] Initializing MaxMind...');
        await initMaxMind();

        // Step 2: Fetch ALL Solana nodes
        console.log('📡 [Cron] Fetching Solana nodes...');
        const allNodes = await fetchSolanaNodes(); // No limit = fetch all

        if (!allNodes || allNodes.length === 0) {
            throw new Error('No nodes returned from Solana RPC');
        }

        console.log(`✅ [Cron] Fetched ${allNodes.length} nodes`);

        // Step 3: Categorize by provider
        console.log('🔍 [Cron] Categorizing nodes by provider...');
        const providerDistribution = await categorizeNodesByProvider(allNodes);

        // Step 4: Filter OVH nodes with geolocation
        console.log('🔎 [Cron] Filtering OVH nodes...');
        const ovhNodes = await filterOVHNodes(allNodes);

        console.log(`✅ [Cron] Found ${ovhNodes.length} OVH nodes (${((ovhNodes.length / allNodes.length) * 100).toFixed(2)}%)`);

        // Step 5: Calculate metrics
        console.log('📈 [Cron] Calculating metrics...');
        const metrics = calculateMetrics(allNodes, ovhNodes, providerDistribution);

        // Step 6: Save to cache
        console.log('💾 [Cron] Saving to cache database...');
        await writeCache(metrics, allNodes.length);

        // Step 7: Save historical snapshot
        console.log('📚 [Cron] Saving historical metrics...');
        await MetricsRepository.saveMetrics(metrics);

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('✅ [Cron] Data refresh completed successfully!');
        console.log(`⏱️  [Cron] Total time: ${totalTime}s`);

        return NextResponse.json({
            success: true,
            message: 'Data refreshed successfully',
            stats: {
                totalNodes: allNodes.length,
                ovhNodes: ovhNodes.length,
                marketShare: metrics.marketShare.toFixed(2) + '%',
                processingTimeSeconds: parseFloat(totalTime),
                timestamp: new Date().toISOString(),
            }
        });

    } catch (error) {
        console.error('❌ [Cron] Error:', error);

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

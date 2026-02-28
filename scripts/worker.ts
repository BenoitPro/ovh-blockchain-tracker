#!/usr/bin/env tsx

/**
 * Background Worker for Solana Node Data Collection (MaxMind Edition)
 * 
 * This script fetches ALL Solana nodes, analyzes OVH infrastructure using MaxMind,
 * and caches the results to a JSON file for fast API responses.
 * 
 * Key improvements with MaxMind:
 * - 150x faster ASN resolution (< 1ms per IP vs 1500ms)
 * - No rate limits (offline resolution)
 * - Can process ALL nodes (no limit)
 * - 95% reduction in external API calls
 * 
 * Usage:
 *   npx tsx scripts/worker.ts
 * 
 * Recommended: Run via cron every hour
 */

import { fetchEnrichedNodes } from '../src/lib/solana/getAllNodes';
import { filterOVHNodes, categorizeNodesByProvider } from '../src/lib/solana/filterOVH';
import { calculateMetrics } from '../src/lib/solana/calculateMetrics';
import { writeCache } from '../src/lib/cache/storage';
import { initMaxMind } from '../src/lib/asn/maxmind';
import { MetricsRepository } from '../src/lib/db/metrics-repository';

// NO LIMIT - Fetch ALL nodes to get accurate market share
const NODE_LIMIT = undefined; // undefined = fetch all nodes

async function runWorker() {
    console.log('🚀 [Worker] Starting Solana data collection with MaxMind...');
    console.log(`⏰ [Worker] Timestamp: ${new Date().toISOString()}`);
    console.log('');

    const startTime = Date.now();

    try {
        // Step 0: Initialize MaxMind (CRITICAL - must be done before any IP resolution)
        console.log('📦 [Worker] Initializing MaxMind GeoLite2 ASN database...');
        await initMaxMind();
        console.log('✅ [Worker] MaxMind initialized successfully');
        console.log('');

        // Step 1: Fetch ALL Solana nodes
        console.log('📡 [Worker] Fetching ALL Solana nodes (no limit)...');
        // We use fetchEnrichedNodes to get Names, Stake, Vote Accounts etc.
        const allNodes = await fetchEnrichedNodes();

        if (!allNodes || allNodes.length === 0) {
            throw new Error('No nodes returned from Solana RPC');
        }

        console.log(`✅ [Worker] Fetched ${allNodes.length} nodes from Solana mainnet`);
        console.log('');

        // Step 2: Categorize nodes by provider (ultra-fast with MaxMind)
        console.log('🔍 [Worker] Analyzing provider distribution with MaxMind...');
        const categorizeStart = Date.now();
        const providerDistribution = await categorizeNodesByProvider(allNodes);
        const categorizeTime = ((Date.now() - categorizeStart) / 1000).toFixed(2);

        console.log('📊 [Worker] Provider distribution:', providerDistribution);
        console.log(`⏱️  [Worker] Categorization completed in ${categorizeTime}s`);
        console.log('');

        // Step 3: Filter OVH nodes specifically (with geolocation enrichment)
        console.log('🔎 [Worker] Filtering OVH nodes and enriching with geolocation...');
        const filterStart = Date.now();
        const ovhNodes = await filterOVHNodes(allNodes);
        const filterTime = ((Date.now() - filterStart) / 1000).toFixed(2);

        console.log(`✅ [Worker] Found ${ovhNodes.length} OVH nodes`);
        console.log(`⏱️  [Worker] Filtering completed in ${filterTime}s`);
        console.log('');

        // Step 4: Calculate metrics
        console.log('📈 [Worker] Calculating market share metrics...');
        const metrics = calculateMetrics(allNodes, ovhNodes, providerDistribution);

        // Step 5: Save to cache
        console.log('💾 [Worker] Saving to cache...');
        await writeCache(metrics, allNodes.length);

        // Step 6: Save to database (historical metrics)
        console.log('📊 [Worker] Saving to historical database...');
        try {
            MetricsRepository.saveMetrics(metrics);
            const recordCount = MetricsRepository.getRecordCount();
            const dateRange = MetricsRepository.getDateRange();
            console.log(`✅ [Worker] Saved to database (${recordCount} total records)`);
            if (dateRange.oldest && dateRange.newest) {
                console.log(`   Date range: ${dateRange.oldest.toISOString().split('T')[0]} to ${dateRange.newest.toISOString().split('T')[0]}`);
            }
        } catch (dbError) {
            console.warn('⚠️  [Worker] Failed to save to database (cache still updated):', dbError);
            // Don't fail the entire worker if DB save fails - cache is still valid
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('');
        console.log('✅ [Worker] Data collection completed successfully!');
        console.log('═'.repeat(60));
        console.log('📊 [Worker] SUMMARY:');
        console.log('─'.repeat(60));
        console.log(`   Total nodes analyzed: ${allNodes.length}`);
        console.log(`   OVH nodes found: ${ovhNodes.length}`);
        console.log(`   OVH market share: ${metrics.marketShare.toFixed(2)}%`);
        console.log(`   AWS market share: ${((providerDistribution.aws / allNodes.length) * 100).toFixed(2)}%`);
        console.log(`   Hetzner market share: ${((providerDistribution.hetzner / allNodes.length) * 100).toFixed(2)}%`);
        console.log(`   Others: ${((providerDistribution.others / allNodes.length) * 100).toFixed(2)}%`);
        console.log('─'.repeat(60));
        console.log(`   Estimated OVH revenue: €${(metrics.estimatedRevenue || 0).toLocaleString()}/month`);
        console.log('─'.repeat(60));
        console.log(`   Total processing time: ${totalTime}s`);
        console.log(`   Performance: ${(allNodes.length / parseFloat(totalTime)).toFixed(0)} nodes/second`);
        console.log('═'.repeat(60));
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ [Worker] Error:', error);
        console.error('');
        console.error('Troubleshooting:');
        console.error('- Ensure MaxMind database is installed (run: node scripts/download-maxmind.js)');
        console.error('- Check that data/GeoLite2-ASN.mmdb exists');
        console.error('- Verify Solana RPC endpoint is accessible');
        process.exit(1);
    }
}

// Run the worker
runWorker();

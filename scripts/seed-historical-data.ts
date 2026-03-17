#!/usr/bin/env tsx

/**
 * Seed Script - Generate Historical Data for Testing
 * 
 * This script generates realistic historical data for the last 90 days
 * to test the trend chart visualization without waiting for real data collection.
 * 
 * Usage:
 *   npx tsx scripts/seed-historical-data.ts
 */

require('dotenv').config({ path: '.env.local' });
import { MetricsRepository } from '../src/lib/db/metrics-repository';
import { DashboardMetrics } from '../src/types';

const DAYS_TO_GENERATE = 1825; // 5 years

// Base values for realistic simulation (updated to match production stats: ~5100 total, ~710 OVH)
const BASE_TOTAL_NODES = 5100;
const BASE_OVH_NODES = 710;
const BASE_MARKET_SHARE = (BASE_OVH_NODES / BASE_TOTAL_NODES) * 100;

/**
 * Generate realistic variation using sine wave + random noise
 */
function generateVariation(dayIndex: number, baseValue: number, amplitude: number): number {
    // Sine wave for gradual trend (30-day cycle)
    const trend = Math.sin((dayIndex / 30) * Math.PI * 2) * amplitude;

    // Random noise (±5%)
    const noise = (Math.random() - 0.5) * baseValue * 0.05;

    return Math.max(1, Math.round(baseValue + trend + noise));
}

async function seedHistoricalData() {
    console.log('🌱 [Seed] Starting historical data generation...');
    console.log(`📅 [Seed] Generating ${DAYS_TO_GENERATE} days of data`);
    console.log('');

    const now = new Date();
    let successCount = 0;

    for (let i = DAYS_TO_GENERATE - 1; i >= 0; i--) {
        // Calculate date (going backwards from today)
        const date = new Date(now);
        date.setUTCDate(date.getUTCDate() - i);
        date.setUTCHours(0, 0, 0, 0);

        // Generate realistic variations
        const totalNodes = generateVariation(i, BASE_TOTAL_NODES, 100);
        const ovhNodes = generateVariation(i, BASE_OVH_NODES, 3);
        const marketShare = (ovhNodes / totalNodes) * 100;
        const estimatedRevenue = ovhNodes * 150; // €150 per node

        // Mock geo distribution (simplified)
        const geoDistribution = {
            France: Math.round(ovhNodes * 0.4),
            Germany: Math.round(ovhNodes * 0.3),
            Poland: Math.round(ovhNodes * 0.2),
            Canada: Math.round(ovhNodes * 0.1),
        };

        // Mock provider distribution
        const providerDistribution = {
            ovh: ovhNodes,
            aws: Math.round(totalNodes * 0.35),
            hetzner: Math.round(totalNodes * 0.25),
            others: totalNodes - ovhNodes - Math.round(totalNodes * 0.35) - Math.round(totalNodes * 0.25),
        };

        const metrics: DashboardMetrics = {
            totalNodes,
            ovhNodes,
            marketShare,
            estimatedRevenue,
            geoDistribution,
            providerDistribution,
            topValidators: [], // Not needed for trend chart
        };

        try {
            MetricsRepository.saveMetrics(metrics, date.getTime());
            successCount++;

            if (i % 10 === 0) {
                console.log(`✅ [Seed] Generated ${DAYS_TO_GENERATE - i}/${DAYS_TO_GENERATE} days...`);
            }
        } catch (error) {
            console.error(`❌ [Seed] Failed to save data for ${date.toISOString()}:`, error);
        }
    }

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ [Seed] Historical data generation completed!');
    console.log('─'.repeat(60));
    console.log(`   Total days generated: ${successCount}/${DAYS_TO_GENERATE}`);
    console.log(`   Date range: ${new Date(now.getTime() - DAYS_TO_GENERATE * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`);
    console.log('─'.repeat(60));
    console.log('   You can now test the trend chart at http://localhost:3000');
    console.log('═'.repeat(60));
    console.log('');

    process.exit(0);
}

// Run the seed script
seedHistoricalData().catch((error) => {
    console.error('❌ [Seed] Fatal error:', error);
    process.exit(1);
});

#!/usr/bin/env tsx

/**
 * Background Worker — BNB Chain Peer Collection
 *
 * Fetches BNB Chain peers, runs MaxMind ASN analysis,
 * and writes results to the `cache` table under key `bnbchain-metrics`.
 *
 * Usage  : npx tsx scripts/worker-bnb.ts
 * npm    : npm run worker:bnb
 */

require('dotenv').config({ path: '.env.local' });
import { initMaxMind } from '../src/lib/asn/maxmind';
import { fetchBNBPeers } from '../src/lib/bnbchain/fetchPeers';
import { getOVHBNBNodes, categorizeBNBByProvider } from '../src/lib/bnbchain/filterOVH';
import { calculateBNBMetrics } from '../src/lib/bnbchain/calculateMetrics';
import { writeChainCache } from '../src/lib/cache/chain-storage';
import { logger } from '../src/lib/utils';

async function run() {
  const start = Date.now();
  logger.info('[Worker BNB] Starting BNB Chain data refresh...');
  logger.info(`[Worker BNB] Timestamp: ${new Date().toISOString()}`);

  // 1. Initialize MaxMind (shared with other chains — idempotent init)
  logger.info('[Worker BNB] Initializing MaxMind...');
  await initMaxMind();
  logger.info('[Worker BNB] MaxMind ready');

  // 2. Fetch peers
  logger.info('[Worker BNB] Fetching BNB Chain peers...');
  const { nodes, validatorCount, providerResolutions } = await fetchBNBPeers();
  const resolvedProviders = providerResolutions.filter(r => r.ips.length > 0).length;
  logger.info(`[Worker BNB] Resolved ${resolvedProviders}/${providerResolutions.length} providers → ${nodes.length} unique IPs | Validators on-chain: ${validatorCount}`);

  // 3. Provider categorization + OVH filter in parallel
  logger.info('[Worker BNB] Categorizing by provider and finding OVH nodes...');
  const [ovhNodes, categorization] = await Promise.all([
    getOVHBNBNodes(nodes),
    categorizeBNBByProvider(nodes),
  ]);
  const pct = nodes.length > 0 ? ((ovhNodes.length / nodes.length) * 100).toFixed(2) : '0';
  logger.info(`[Worker BNB] OVH: ${ovhNodes.length} / ${nodes.length} endpoints (${pct}%)`);

  // 4. Calculate metrics
  const metrics = calculateBNBMetrics(ovhNodes, nodes.length, validatorCount, categorization, resolvedProviders);

  // 5. Write to cache (key: 'bnbchain-metrics')
  logger.info('[Worker BNB] Writing to cache...');
  await writeChainCache('bnbchain', metrics, nodes.length);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  logger.info(`[Worker BNB] Done in ${elapsed}s — ${nodes.length} peers, ${ovhNodes.length} OVH (${metrics.marketShare.toFixed(2)}%)`);
}

run().catch(err => {
  logger.error('[Worker BNB] Fatal error:', err);
  process.exit(1);
});

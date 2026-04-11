import { filterOVHNodesByASN, categorizeByProvider } from '@/lib/shared/filterOVH';
import type { ProviderCategorizationResult } from '@/lib/shared/filterOVH';
import { identifyProvider } from '@/lib/shared/providers';
import type { BNBChainNode, BNBChainOVHNode } from '@/types/bnbchain';

function extractIP(node: BNBChainNode): string {
  return node.ip;
}

export async function getOVHBNBNodes(nodes: BNBChainNode[]): Promise<BNBChainOVHNode[]> {
  const enriched = await filterOVHNodesByASN(nodes, extractIP);
  return enriched.map(({ node, enrichment }) => ({
    ...node,
    ipInfo: {
      ip: node.ip,
      asn: enrichment.asn,
      org: enrichment.org,
      country: enrichment.country,
      country_name: enrichment.country_name,
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
    },
    provider: identifyProvider(enrichment.asn, enrichment.org),
    // `version` field holds the BSC provider name (e.g. "Ankr") — mapped to providerName
    providerName: node.version,
  }));
}

export async function categorizeBNBByProvider(nodes: BNBChainNode[]): Promise<ProviderCategorizationResult> {
  return categorizeByProvider(nodes, extractIP);
}

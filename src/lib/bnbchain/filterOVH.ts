import { filterOVHNodesByASN, categorizeByProvider } from '@/lib/shared/filterOVH';
import type { ProviderCategorizationResult } from '@/lib/shared/filterOVH';
import { identifyProvider } from '@/lib/shared/providers';
import { batchGetASN } from '@/lib/asn/maxmind';
import { PROVIDER_ASN_MAP, PROVIDER_LABELS } from '@/lib/config/constants';
import type { BNBChainNode, BNBChainOVHNode, BNBProviderDetail } from '@/types/bnbchain';
import type { BNBProviderResolution } from './fetchPeers';

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

function infraFromASN(asn: string, org: string): string {
  for (const [key, info] of Object.entries(PROVIDER_ASN_MAP)) {
    if (info.asns.includes(asn)) return PROVIDER_LABELS[key] ?? key;
  }
  // Use the actual org name from MaxMind instead of a generic "Other"
  if (org && org !== 'Unknown') return org;
  return asn; // last resort: show the ASN itself
}

/**
 * Enrich provider resolutions with infrastructure info from MaxMind.
 * Determines the dominant cloud provider behind each BSC RPC provider hostname.
 * Must be called after MaxMind is initialized (i.e. after filterOVHNodesByASN).
 */
export function enrichProviderResolutions(
  resolutions: BNBProviderResolution[],
  ovhNodes: BNBChainOVHNode[],
): BNBProviderDetail[] {
  const allIPs = resolutions.flatMap(r => r.ips);
  const asnMap = batchGetASN(allIPs);
  const ovhIPSet = new Set(ovhNodes.map(n => n.ip));

  return resolutions.map(r => {
    const infraCounts: Record<string, number> = {};
    for (const ip of r.ips) {
      const asnInfo = asnMap.get(ip);
      const infra = asnInfo ? infraFromASN(asnInfo.asn, asnInfo.org) : 'Unknown';
      infraCounts[infra] = (infraCounts[infra] ?? 0) + 1;
    }
    const dominantInfra = Object.entries(infraCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';

    return {
      providerName: r.providerName,
      hostname: r.hostname,
      tier: r.tier,
      ipCount: r.ips.length,
      infrastructure: dominantInfra,
      isOnOVH: r.ips.some(ip => ovhIPSet.has(ip)),
    };
  });
}

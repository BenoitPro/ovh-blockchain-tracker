import { CelestiaNode, CelestiaIPInfo, CelestiaOVHNode } from '@/types';
import { extractCelestiaIP } from './fetchPeers';
import { identifyProvider } from '@/lib/shared/providers';
import {
    filterOVHNodesByASN,
    categorizeByProvider,
    ProviderCategorizationResult,
} from '@/lib/shared/filterOVH';

export async function filterOVHCelestiaNodes(nodes: CelestiaNode[]): Promise<CelestiaOVHNode[]> {
    const results = await filterOVHNodesByASN(
        nodes,
        (node) => extractCelestiaIP(node),
        'Celestia',
    );

    return results.map(({ node, enrichment }) => ({
        ...node,
        ipInfo: {
            ip: enrichment.ip,
            asn: enrichment.asn,
            org: enrichment.org,
            country: enrichment.country,
            country_name: enrichment.country_name,
            city: 'Unknown',
            lat: 0,
            lon: 0,
        } satisfies CelestiaIPInfo,
        provider: identifyProvider(enrichment.asn, enrichment.org),
    }));
}

export type { ProviderCategorizationResult as CelestiaProviderCategorizationResult };

export async function categorizeCelestiaNodesByProvider(
    nodes: CelestiaNode[],
): Promise<ProviderCategorizationResult> {
    return categorizeByProvider(nodes, (node) => extractCelestiaIP(node), 'Celestia');
}

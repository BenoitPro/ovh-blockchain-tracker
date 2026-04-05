import { AvalancheNode, AvalancheIPInfo, AvalancheOVHNode } from '@/types';
import { extractAvalancheIP } from './fetchPeers';
import { identifyProvider } from '@/lib/shared/providers';
import {
    filterOVHNodesByASN,
    categorizeByProvider,
    ProviderCategorizationResult,
} from '@/lib/shared/filterOVH';

export async function filterOVHAvalancheNodes(nodes: AvalancheNode[]): Promise<AvalancheOVHNode[]> {
    const results = await filterOVHNodesByASN(
        nodes,
        (node) => extractAvalancheIP(node.ip),
        'Avalanche',
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
            latitude: 0,
            longitude: 0,
        } satisfies AvalancheIPInfo,
        provider: identifyProvider(enrichment.asn, enrichment.org),
    }));
}

export type { ProviderCategorizationResult as AvalancheProviderCategorizationResult };

export async function categorizeAvalancheNodesByProvider(
    nodes: AvalancheNode[],
): Promise<ProviderCategorizationResult> {
    return categorizeByProvider(nodes, (node) => extractAvalancheIP(node.ip), 'Avalanche');
}

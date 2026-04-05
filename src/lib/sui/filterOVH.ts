import { SuiValidator, SuiOVHNode, SuiIPInfo } from '@/types/sui';
import { identifyProvider } from '@/lib/shared/providers';
import {
    filterOVHNodesByASN,
    categorizeByProvider,
    ProviderCategorizationResult,
} from '@/lib/shared/filterOVH';

export async function filterOVHSuiNodes(validators: SuiValidator[]): Promise<SuiOVHNode[]> {
    const results = await filterOVHNodesByASN(
        validators,
        (v) => v.ip ?? null,
        'Sui',
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
        } satisfies SuiIPInfo,
        provider: identifyProvider(enrichment.asn, enrichment.org),
    }));
}

export type { ProviderCategorizationResult as SuiProviderCategorizationResult };

export async function categorizeSuiNodesByProvider(
    validators: SuiValidator[],
): Promise<ProviderCategorizationResult> {
    return categorizeByProvider(validators, (v) => v.ip ?? null, 'Sui');
}

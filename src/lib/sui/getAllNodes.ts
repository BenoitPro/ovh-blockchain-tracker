import { SuiValidator, SuiOVHNode } from '@/types/sui';
import { fetchSuiValidators } from './fetchValidators';
import { initMaxMind, getASNFromMaxMind, getCountryFromMaxMind, batchGetASN, batchGetCountry } from '@/lib/asn/maxmind';
import { PROVIDER_ASN_MAP } from '@/lib/config/constants';
import { logger } from '@/lib/utils';

// Provider identification logic (shared with other chains)
function identifyProvider(asn: string, orgName: string): string {
    for (const [, info] of Object.entries(PROVIDER_ASN_MAP)) {
        if (info.asns.includes(asn)) return info.label;
    }
    const o = orgName.toLowerCase();
    if (o.includes('amazon') || o.includes('aws')) return 'AWS';
    if (o.includes('google')) return 'Google Cloud';
    if (o.includes('hetzner')) return 'Hetzner';
    if (o.includes('digitalocean') || o.includes('digital ocean')) return 'DigitalOcean';
    if (o.includes('ovh')) return 'OVHcloud';
    if (o.includes('alibaba')) return 'Alibaba Cloud';
    if (o.includes('oracle')) return 'Oracle Cloud';
    if (o.includes('microsoft') || o.includes('azure')) return 'Azure';
    return orgName || 'Unknown Provider';
}

export async function fetchEnrichedSuiNodes(): Promise<SuiOVHNode[]> {
    try {
        await initMaxMind();

        // 1. Fetch all validators (with DNS resolution)
        const validators = await fetchSuiValidators();

        // 2. Extract IPs for batch processing
        const ips: string[] = [];
        for (const v of validators) {
            if (v.ip) ips.push(v.ip);
        }

        // 3. Get ASN and Country in batch
        const asnResults = batchGetASN(ips);
        const countryResults = batchGetCountry(ips);

        // 4. Enrich every validator
        const enrichedNodes: SuiOVHNode[] = validators.map(v => {
            const asnInfo = v.ip ? asnResults.get(v.ip) : null;
            const countryInfo = v.ip ? countryResults.get(v.ip) : null;

            const ipInfo = {
                ip: v.ip || 'Unknown',
                asn: asnInfo?.asn || 'AS Unknown',
                org: asnInfo?.org || 'Unknown Provider',
                country: countryInfo?.countryCode || 'Unknown',
                country_name: countryInfo?.country || 'Unknown',
                city: 'Unknown',
                lat: 0,
                lon: 0,
            };

            return {
                ...v,
                ipInfo,
                provider: identifyProvider(ipInfo.asn, ipInfo.org),
            };
        });

        // Sort by Voting Power descending
        enrichedNodes.sort((a, b) => parseInt(b.votingPower) - parseInt(a.votingPower));

        logger.info(`[Sui/Explorer] Enriched ${enrichedNodes.length} nodes for the explorer`);
        return enrichedNodes;

    } catch (error) {
        logger.error('[Sui/Explorer] Enrichment failed:', error);
        throw error;
    }
}

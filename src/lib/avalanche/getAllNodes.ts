import { AvalancheNode, AvalancheOVHNode, AvalancheIPInfo } from '@/types';
import { fetchAvalanchePeers, extractAvalancheIP } from './fetchPeers';
import {
    initMaxMind,
    batchGetASN,
    batchGetCountry,
} from '@/lib/asn/maxmind';
import { identifyProvider } from '@/lib/shared/providers';
import { logger } from '@/lib/utils';

/**
 * Fetch all Avalanche peers and enrich every node with MaxMind ASN + country data.
 *
 * Returns ALL peers (not just OVH) so the node explorer can display the full
 * network with per-provider colouring — identical pattern to lib/sui/getAllNodes.ts.
 */
export async function fetchEnrichedAvalancheNodes(): Promise<AvalancheOVHNode[]> {
    try {
        await initMaxMind();

        const peers: AvalancheNode[] = await fetchAvalanchePeers();

        // Extract clean IPs for batch lookup
        const ips: string[] = [];
        for (const peer of peers) {
            const ip = extractAvalancheIP(peer.ip);
            if (ip) ips.push(ip);
        }

        const asnResults = batchGetASN(ips);
        const countryResults = batchGetCountry(ips);

        const enriched: AvalancheOVHNode[] = peers.map(peer => {
            const cleanIP = extractAvalancheIP(peer.ip) ?? '';
            const asnInfo = cleanIP ? asnResults.get(cleanIP) : null;
            const countryInfo = cleanIP ? countryResults.get(cleanIP) : null;

            const ipInfo: AvalancheIPInfo = {
                ip: cleanIP || peer.ip,
                asn: asnInfo?.asn || 'AS Unknown',
                org: asnInfo?.org || 'Unknown Provider',
                country: countryInfo?.countryCode || 'Unknown',
                country_name: countryInfo?.country || 'Unknown',
                city: 'Unknown',
                latitude: 0,
                longitude: 0,
            };

            return {
                ...peer,
                ipInfo,
                provider: identifyProvider(ipInfo.asn, ipInfo.org),
            };
        });

        // Sort by uptime descending
        enriched.sort((a, b) => (b.observedUptime ?? 0) - (a.observedUptime ?? 0));

        logger.info(`[Avalanche/Explorer] Enriched ${enriched.length} peers`);
        return enriched;
    } catch (error) {
        logger.error('[Avalanche/Explorer] Enrichment failed:', error);
        throw error;
    }
}

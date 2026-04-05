import { NextResponse } from 'next/server';
import { readChainCache } from '@/lib/cache/chain-storage';
import { CountryDetailResponse, CountryNode, EnrichedNode, DashboardMetrics } from '@/types';
import { logger } from '@/lib/utils';

// Maps 2-letter ISO codes to full country names
const ISO_TO_NAME: Record<string, string> = {
    FR: 'France', DE: 'Germany', GB: 'United Kingdom', NL: 'Netherlands',
    ES: 'Spain', IT: 'Italy', PL: 'Poland', SE: 'Sweden', CH: 'Switzerland',
    BE: 'Belgium', FI: 'Finland', US: 'United States', CA: 'Canada',
    SG: 'Singapore', JP: 'Japan', CN: 'China', IN: 'India', KR: 'South Korea',
    RU: 'Russia', AU: 'Australia', BR: 'Brazil',
};

/**
 * Mask IP — keep only first octet visible for privacy
 * 51.178.65.12 → 51.XXX.XXX.XXX
 */
function maskIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length !== 4) return 'XXX.XXX.XXX.XXX';
    return `${parts[0]}.XXX.XXX.XXX`;
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    const countryCode = code.toUpperCase();
    const countryName = ISO_TO_NAME[countryCode];

    if (!countryName) {
        return NextResponse.json(
            { success: false, error: `Unknown country code: ${countryCode}` } as CountryDetailResponse,
            { status: 404 }
        );
    }

    try {
        const cache = await readChainCache<DashboardMetrics>('solana');

        if (!cache || !cache.data) {
            return NextResponse.json(
                { success: false, error: 'No data in cache. Run the worker first.' } as CountryDetailResponse,
                { status: 503 }
            );
        }

        // topValidators are EnrichedNode[] with `country` = ISO code (set in calculateMetrics)
        const allValidators: EnrichedNode[] = cache.data?.topValidators ?? [];

        const countryNodes: CountryNode[] = allValidators
            .filter((v) => v.country === countryCode)
            .map((v) => ({
                pubkey: v.pubkey,
                ip: maskIP(v.ip || '0.0.0.0'),
                city: v.city || 'Unknown',
                activatedStake: v.activatedStake || 0,
                commission: v.commission || 0,
                votePubkey: v.votePubkey || '',
                isValidator: !!v.votePubkey,
                version: v.version ?? null,
                name: v.name,
                image: v.image,
            }))
            .sort((a, b) => b.activatedStake - a.activatedStake);

        const totalStake = countryNodes.reduce((s, n) => s + n.activatedStake, 0);

        logger.info(`[API /country/${countryCode}] Returning ${countryNodes.length} nodes`);

        return NextResponse.json({
            success: true,
            countryCode,
            countryName,
            nodes: countryNodes,
            totalNodes: countryNodes.length,
            totalStake,
        } as CountryDetailResponse);
    } catch (error) {
        logger.error(`[API /country/${countryCode}] Error:`, error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' } as CountryDetailResponse,
            { status: 500 }
        );
    }
}

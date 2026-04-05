import { NextResponse } from 'next/server';
import { readChainCache } from '@/lib/cache/chain-storage';
import { DashboardMetrics } from '@/types';
import { logger } from '@/lib/utils';

/**
 * Mask IP — keep only first octet visible for privacy
 * 51.178.65.12 → 51.XXX.XXX.XXX
 */
function maskIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length !== 4) return 'XXX.XXX.XXX.XXX';
    return `${parts[0]}.XXX.XXX.XXX`;
}

/**
 * GET /api/export
 * Returns a CSV file with OVH Solana nodes data.
 * IPs are masked for privacy (first octet only).
 */
export async function GET() {
    try {
        const cache = await readChainCache<DashboardMetrics>('solana');

        if (!cache || !cache.data) {
            return NextResponse.json({ error: 'No data available. Run the worker first.' }, { status: 503 });
        }

        const { topValidators, geoDistribution } = cache.data;
        const date = new Date().toISOString().split('T')[0];
        const filename = `ovh-solana-nodes-${date}.csv`;

        // CSV header
        const headers = ['ip_masked', 'country', 'city', 'stake_sol', 'is_validator', 'provider', 'asn', 'pubkey'];

        // Build rows from topValidators (enriched nodes)
        const rows: string[][] = (topValidators || []).map((v: {
            pubkey: string;
            ip?: string;
            ipInfo?: { ip?: string; country?: string; city?: string };
            countryName?: string;
            country?: string;
            city?: string;
            activatedStake?: number;
            votePubkey?: string;
            provider?: string;
            asn?: string;
        }) => {
            const ip = v.ip || v.ipInfo?.ip || '';
            const country = v.countryName || v.country || '';
            const city = v.city || v.ipInfo?.city || '';
            const stakeSol = v.activatedStake ? (v.activatedStake / 1e9).toFixed(2) : '0';
            const isValidator = v.votePubkey ? 'true' : 'false';
            const provider = v.provider || 'OVHcloud';
            const asn = v.asn || '';

            return [
                maskIP(ip),
                country,
                city,
                stakeSol,
                isValidator,
                provider,
                asn,
                v.pubkey,
            ];
        });

        // Include geoDistribution summary rows if no validators data
        if (rows.length === 0 && geoDistribution) {
            for (const [country, count] of Object.entries(geoDistribution)) {
                for (let i = 0; i < count; i++) {
                    rows.push(['XXX.XXX.XXX.XXX', country, 'Unknown', '0', 'false', 'OVHcloud', '', '']);
                }
            }
        }

        // Escape CSV fields
        const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

        const csvLines = [
            headers.map(escape).join(','),
            ...rows.map((row) => row.map(escape).join(',')),
        ];

        const csv = csvLines.join('\n');

        logger.info(`[API /export] Generating CSV with ${rows.length} rows`);

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        logger.error('[API /export] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

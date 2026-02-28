import { NextRequest, NextResponse } from 'next/server';
import { getIPInfo } from '@/lib/solana/filterOVH';
import { initMaxMind } from '@/lib/asn/maxmind';
import { logger } from '@/lib/utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ip: string }> }
) {
    const { ip } = await params;
    try {
        if (!ip) {
            return NextResponse.json({ success: false, error: 'IP is required' }, { status: 400 });
        }

        // Ensure MaxMind is initialized
        await initMaxMind();

        // Get full IP info (including geolocation)
        const ipInfo = await getIPInfo(ip, true);

        if (!ipInfo) {
            return NextResponse.json({ success: false, error: 'Failed to fetch IP info' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: ipInfo
        });
    } catch (error) {
        logger.error(`Error in node detail API [${ip}]:`, error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getTopVerifiedOVHValidators } from '@/lib/validators/verified-ovh';
import { logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get('chain');
    const limit = parseInt(searchParams.get('limit') || '8');

    if (!chainId || (chainId !== 'solana' && chainId !== 'sui')) {
        return NextResponse.json({ success: false, error: 'Invalid or missing chain ID' }, { status: 400 });
    }

    try {
        const validators = await getTopVerifiedOVHValidators(chainId, limit);
        
        return NextResponse.json({
            success: true,
            data: validators,
            chainId,
            timestamp: Date.now()
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
            }
        });
    } catch (error) {
        logger.error(`[API:Verified] Error fetching for ${chainId}:`, error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

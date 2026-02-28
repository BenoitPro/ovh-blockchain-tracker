import { NextRequest, NextResponse } from 'next/server';
import { MetricsRepository } from '@/lib/db/metrics-repository';
import { TrendPeriod, TrendResponse } from '@/types';
import { logger } from '@/lib/utils';

/**
 * GET /api/trends?period=7|30|90
 * Returns historical market share data for trend visualization
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const periodParam = searchParams.get('period');

        // Validate period parameter
        const validNumericPeriods: number[] = [90, 365];
        let period: TrendPeriod;

        if (periodParam === 'all') {
            period = 'all';
        } else {
            const numericPeriod = periodParam ? parseInt(periodParam, 10) : 90;
            if (!validNumericPeriods.includes(numericPeriod)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Invalid period. Must be one of: ${validNumericPeriods.join(', ')}, all`,
                    } as TrendResponse,
                    { status: 400 }
                );
            }
            period = numericPeriod as TrendPeriod;
        }

        // Fetch data from database
        const data = MetricsRepository.getMetricsByPeriod(period);

        logger.info(`[API /trends] Returning ${data.length} data points for period=${period}`);

        const response: TrendResponse = {
            success: true,
            period: period as TrendPeriod,
            data,
        };

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        logger.error('[API /trends] Error fetching trend data:', error);

        const errorResponse: TrendResponse = {
            success: false,
            period: 90,
            data: [],
            error: error instanceof Error ? error.message : 'Failed to fetch trend data',
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}

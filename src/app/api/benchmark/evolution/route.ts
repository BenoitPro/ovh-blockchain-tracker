import { NextRequest, NextResponse } from 'next/server';
import { readBenchmarkEvolution, readWeeklyDelta } from '@/lib/benchmark/snapshotRepository';
import { logger } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chainId = searchParams.get('chain') ?? undefined;
    const months = Math.min(parseInt(searchParams.get('months') ?? '6', 10), 12);

    const [evolution, weeklyDelta] = await Promise.all([
      readBenchmarkEvolution(chainId, months),
      readWeeklyDelta(),
    ]);

    return NextResponse.json({
      success: true,
      monthly: evolution.monthly,
      providers: evolution.providers,
      weeklyDelta,
    });
  } catch (error) {
    logger.error('[benchmark/evolution] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read benchmark evolution' },
      { status: 500 },
    );
  }
}

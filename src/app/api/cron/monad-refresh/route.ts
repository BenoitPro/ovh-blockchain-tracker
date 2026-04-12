import { fetchMonadValidators } from '@/lib/monad/fetchValidators';
import { calculateMonadMetrics } from '@/lib/monad/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { createCronHandler } from '@/lib/utils/cronHandler';

/**
 * Vercel Cron Job — Monad validator data refresh
 * Schedule: 0 6 * * * (06:00 UTC daily — see vercel.json)
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('MONAD', async () => {
    const validators = await fetchMonadValidators();
    if (!validators.length) throw new Error('No validators returned from gmonads.com');

    const metrics = calculateMonadMetrics(validators);
    await writeChainCache('monad', metrics, validators.length);

    return {
        totalValidators: validators.length,
        activeValidators: metrics.activeValidators,
        countries: metrics.countryCount,
    };
});

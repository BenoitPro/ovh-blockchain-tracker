import { MonadValidator, MonadDashboardMetrics, MonadCountryEntry, MonadCityEntry } from '@/types';

export function calculateMonadMetrics(validators: MonadValidator[]): MonadDashboardMetrics {
    const total = validators.length;
    const active = validators.filter(v => v.active).length;

    const geoDistribution: Record<string, number> = {};
    const countryStake: Record<string, number> = {};
    const cityMap: Record<string, { city: string; country: string; count: number }> = {};

    for (const v of validators) {
        const country = v.country || 'Unknown';
        const city = v.city || 'Unknown';

        geoDistribution[country] = (geoDistribution[country] ?? 0) + 1;
        countryStake[country] = (countryStake[country] ?? 0) + v.stake;

        const cityKey = `${city}|${country}`;
        if (!cityMap[cityKey]) cityMap[cityKey] = { city, country, count: 0 };
        cityMap[cityKey].count += 1;
    }

    const countryCount = Object.keys(geoDistribution).length;
    const totalStakeMON = validators.reduce((s, v) => s + v.stake, 0);
    const avgSuccessRate = total > 0
        ? validators.reduce((s, v) => s + v.successRate, 0) / total
        : 0;

    const countryBreakdown: MonadCountryEntry[] = Object.entries(geoDistribution)
        .map(([country, count]) => ({
            country,
            count,
            totalStake: countryStake[country] ?? 0,
            percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

    const cityBreakdown: MonadCityEntry[] = Object.values(cityMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
        totalValidators: total,
        activeValidators: active,
        countryCount,
        totalStakeMON,
        avgSuccessRate,
        geoDistribution,
        countryBreakdown,
        cityBreakdown,
        // OVH fields — not available without MonadBFT crawler
        ovhNodes: 0,
        marketShare: 0,
    };
}

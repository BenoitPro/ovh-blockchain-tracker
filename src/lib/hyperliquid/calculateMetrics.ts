import {
    HyperliquidValidator,
    HyperliquidOVHValidator,
    HyperliquidDashboardMetrics,
} from '@/types/hyperliquid';
import { ProviderBreakdownEntry } from '@/types/dashboard';
import { PROVIDER_COLORS, PROVIDER_LABELS } from '@/lib/config/constants';

/**
 * Calculate Hyperliquid dashboard metrics from validator data.
 *
 * ── Provider breakdown methodology ───────────────────────────────────────────
 * Because the API provides no IP addresses, provider detection is limited to
 * name/description matching. As a result, most validators fall into "Others"
 * unless they explicitly disclose their cloud provider.
 *
 * Known/named providers are matched against each validator's `name` field
 * using simple keyword rules so we can at least surface AWS, GCP, etc.
 * when validators self-identify (e.g. "Anchorage By Figment").
 *
 * This is intentionally best-effort and documented as such in the UI.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Provider keyword rules for name-based matching */
const PROVIDER_NAME_RULES: { key: string; keywords: string[] }[] = [
    { key: 'aws',          keywords: ['aws', 'amazon'] },
    { key: 'google',       keywords: ['google', 'gcp', 'google cloud'] },
    { key: 'hetzner',      keywords: ['hetzner'] },
    { key: 'digitalocean', keywords: ['digitalocean', 'digital ocean'] },
    { key: 'vultr',        keywords: ['vultr'] },
    { key: 'equinix',      keywords: ['equinix', 'packet'] },
    { key: 'ovh',          keywords: ['ovh', 'ovhcloud', 'soyoustart', 'kimsufi'] },
];

/**
 * Best-effort provider detection from a validator's name and description.
 * Returns the provider key (e.g. "aws") or null if unknown.
 */
function detectProviderFromName(name: string, description: string): string | null {
    const haystack = `${name} ${description}`.toLowerCase();
    for (const rule of PROVIDER_NAME_RULES) {
        if (rule.keywords.some((kw) => haystack.includes(kw))) {
            return rule.key;
        }
    }
    return null;
}

/**
 * Build the provider breakdown array for the ProviderComparison chart.
 * Validators with no detectable provider are grouped into "Others".
 */
function buildProviderBreakdown(
    validators: HyperliquidValidator[],
): ProviderBreakdownEntry[] {
    const counts: Record<string, number> = {};
    const othersNames: Record<string, number> = {};

    for (const v of validators) {
        // Only count active validators for the breakdown
        if (!v.isActive) continue;

        const providerKey = detectProviderFromName(v.name, v.description);
        if (providerKey) {
            counts[providerKey] = (counts[providerKey] ?? 0) + 1;
        } else {
            counts['others'] = (counts['others'] ?? 0) + 1;
            // Track individual validator names inside "Others" for tooltip
            othersNames[v.name] = (othersNames[v.name] ?? 0) + 1;
        }
    }

    const activeTotal = Object.values(counts).reduce((s, n) => s + n, 0);

    const entries: ProviderBreakdownEntry[] = [];

    for (const [key, count] of Object.entries(counts)) {
        if (count === 0) continue;
        if (key === 'others') continue;

        entries.push({
            key,
            label: PROVIDER_LABELS[key] ?? key,
            nodeCount: count,
            marketShare: activeTotal > 0 ? (count / activeTotal) * 100 : 0,
            color: PROVIDER_COLORS[key] ?? '#6B7280',
        });
    }

    // Add "Others" bucket with top sub-validators
    const othersCount = counts['others'] ?? 0;
    if (othersCount > 0) {
        const topOthers = Object.entries(othersNames)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([label, nodeCount]) => ({
                label,
                nodeCount,
                marketShare: activeTotal > 0 ? (nodeCount / activeTotal) * 100 : 0,
            }));

        entries.push({
            key: 'others',
            label: 'Others',
            nodeCount: othersCount,
            marketShare: activeTotal > 0 ? (othersCount / activeTotal) * 100 : 0,
            color: PROVIDER_COLORS['others'],
            subProviders: topOthers,
        });
    }

    // Sort by nodeCount descending
    return entries.sort((a, b) => b.nodeCount - a.nodeCount);
}

/**
 * Compute all metrics needed by the Hyperliquid dashboard.
 */
export function calculateHyperliquidMetrics(
    allValidators: HyperliquidValidator[],
    ovhValidators: HyperliquidOVHValidator[],
): HyperliquidDashboardMetrics {
    const activeValidators = allValidators.filter((v) => v.isActive);
    const totalValidators = allValidators.length;
    const activeCount = activeValidators.length;
    const ovhCount = ovhValidators.length;

    // Stake calculations (raw units — divide by 1e8 for HYPE tokens)
    const totalStake = activeValidators.reduce((s, v) => s + (v.stake ?? 0), 0);
    const ovhStake = ovhValidators.reduce((s, v) => s + (v.stake ?? 0), 0);

    const marketShare = activeCount > 0 ? (ovhCount / activeCount) * 100 : 0;
    const ovhStakeShare = totalStake > 0 ? (ovhStake / totalStake) * 100 : 0;

    const providerBreakdown = buildProviderBreakdown(allValidators);

    return {
        totalValidators,
        activeValidators: activeCount,
        ovhValidators: ovhCount,
        marketShare,
        ovhStakeShare,
        totalStake,
        ovhStake,
        providerBreakdown,
        ovhValidatorList: ovhValidators,
        // IP-based geo distribution is unavailable for Hyperliquid
        geoDistribution: {},
    };
}

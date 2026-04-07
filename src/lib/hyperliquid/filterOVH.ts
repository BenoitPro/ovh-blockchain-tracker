import { HyperliquidValidator, HyperliquidOVHValidator } from '@/types/hyperliquid';
import { logger } from '@/lib/utils';

/**
 * OVH detection for Hyperliquid validators
 *
 * ── Why name-matching instead of MaxMind ─────────────────────────────────────
 * The Hyperliquid API (`validatorSummaries`) does NOT return IP addresses.
 * There is no equivalent to Avalanche's `info.peers` or Solana's gossip
 * protocol that would expose node IPs. Therefore MaxMind ASN lookup cannot
 * be used here.
 *
 * Fallback strategy — name/description matching:
 *   1. Check if `name` contains any OVH-related keyword (case-insensitive).
 *   2. Check if `description` contains any OVH-related keyword.
 *
 * This is a lower-bound estimate: validators running OVH infrastructure
 * without advertising it in their name or description will not be detected.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Keywords that identify OVH affiliation in validator metadata */
const OVH_KEYWORDS = ['ovh', 'ovhcloud', 'ovh cloud', 'soyoustart', 'kimsufi'];

/**
 * Check whether a string contains any OVH-related keyword.
 */
function containsOVHKeyword(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return OVH_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Filter validators that can be identified as running on OVH infrastructure.
 *
 * Detection is best-effort via name/description text matching.
 * Returns an empty array if no OVH validators are found (likely outcome
 * given the current validator set, which does not advertise OVH affiliation).
 */
export function filterOVHHyperliquidValidators(
    validators: HyperliquidValidator[],
): HyperliquidOVHValidator[] {
    const results: HyperliquidOVHValidator[] = [];

    for (const v of validators) {
        if (containsOVHKeyword(v.name)) {
            results.push({
                ...v,
                detectionMethod: 'name-match',
                matchedText: v.name,
            });
            continue;
        }

        if (containsOVHKeyword(v.description)) {
            results.push({
                ...v,
                detectionMethod: 'description-match',
                matchedText: v.description.slice(0, 120),
            });
        }
    }

    logger.info(
        `[Hyperliquid/OVH] ${results.length} OVH validators detected via name/description matching ` +
        `(note: IP-based detection unavailable — API does not expose node IPs)`,
    );

    return results;
}

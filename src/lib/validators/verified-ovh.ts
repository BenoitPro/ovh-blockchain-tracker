import { fetchEnrichedNodes as fetchSolanaNodes } from '@/lib/solana/getAllNodes';
import { fetchSuiValidators } from '@/lib/sui/fetchValidators';
import { filterOVHSuiNodes } from '@/lib/sui/filterOVH';
import { logger } from '@/lib/utils';

export interface VerifiedValidator {
    name: string;
    address: string;
    weight: number; // For sorting (Stake or Voting Power)
    weightFormatted: string;
    image?: string;
    provider: string;
    rank: number;
}

/**
 * Automatically identify top validators hosted on OVHcloud for a given chain.
 * This program analyzes on-chain identity data cross-referenced with infrastructure provider info.
 */
export async function getTopVerifiedOVHValidators(chainId: 'solana' | 'sui', limit: number = 6): Promise<VerifiedValidator[]> {
    try {
        if (chainId === 'solana') {
            const allNodes = await fetchSolanaNodes();
            const ovhValidators = allNodes
                .filter(n => n.provider === 'OVHcloud' && n.name && n.name !== 'Unknown Validator')
                .slice(0, limit)
                .map((n, i) => ({
                    name: n.name || 'Unknown',
                    address: n.pubkey,
                    weight: n.activatedStake || 0,
                    weightFormatted: n.activatedStake ? `${(n.activatedStake / 1_000_000_000).toFixed(0)}k SOL` : '0',
                    image: n.image,
                    provider: 'OVHcloud',
                    rank: i + 1
                }));
            return ovhValidators;
        }

        if (chainId === 'sui') {
            const allValidators = await fetchSuiValidators();
            const ovhValidatorsRaw = await filterOVHSuiNodes(allValidators);
            
            const ovhValidators = ovhValidatorsRaw
                .sort((a, b) => (Number(b.votingPower) - Number(a.votingPower)))
                .slice(0, limit)
                .map((v, i) => ({
                    name: v.name || 'Unknown Validator',
                    address: v.suiAddress,
                    weight: Number(v.votingPower),
                    weightFormatted: `${(Number(v.votingPower) / 100).toFixed(2)}% Power`,
                    provider: 'OVHcloud',
                    rank: i + 1
                }));
            
            return ovhValidators;
        }

        return [];
    } catch (error) {
        logger.error(`[VerifiedProgram] Failed to fetch verified validators for ${chainId}:`, error);
        return [];
    }
}

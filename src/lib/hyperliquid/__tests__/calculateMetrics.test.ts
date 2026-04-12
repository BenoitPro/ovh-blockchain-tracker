import { describe, it, expect } from 'vitest';
import { calculateHyperliquidMetrics } from '../calculateMetrics';
import { HyperliquidValidator, HyperliquidOVHValidator } from '@/types/hyperliquid';

function makeValidator(overrides: Partial<HyperliquidValidator> = {}): HyperliquidValidator {
    return {
        validator: '0x1234567890abcdef',
        signer: '0x1234567890abcdef',
        name: 'Test Validator',
        description: '',
        nRecentBlocks: 100,
        stake: 100_000_000, // 1 HYPE (1e8 units)
        isJailed: false,
        unjailableAfter: null,
        isActive: true,
        commission: '0.05',
        stats: [],
        commissionRate: 0.05,
        dailyUptime: 0.99,
        ...overrides,
    };
}

describe('calculateHyperliquidMetrics', () => {
    it('includes allValidators in the returned metrics', () => {
        const validators = [
            makeValidator({ validator: '0xAAA', name: 'Val A' }),
            makeValidator({ validator: '0xBBB', name: 'Val B' }),
        ];
        const metrics = calculateHyperliquidMetrics(validators, []);
        expect(metrics.allValidators).toHaveLength(2);
        expect(metrics.allValidators.map(v => v.name)).toEqual(['Val A', 'Val B']);
    });

    it('counts only active validators in activeValidators', () => {
        const validators = [
            makeValidator({ validator: '0xACT', isActive: true, isJailed: false }),
            makeValidator({ validator: '0xJAIL', isActive: false, isJailed: true }),
        ];
        const metrics = calculateHyperliquidMetrics(validators, []);
        expect(metrics.activeValidators).toBe(1);
        expect(metrics.totalValidators).toBe(2);
    });

    it('returns 0 OVH market share when no OVH validators detected', () => {
        const validators = [makeValidator(), makeValidator({ validator: '0x5678' })];
        const metrics = calculateHyperliquidMetrics(validators, []);
        expect(metrics.marketShare).toBe(0);
        expect(metrics.ovhValidators).toBe(0);
    });

    it('computes OVH market share correctly when OVH validators present', () => {
        const validators = [
            makeValidator({ validator: '0xOVH', name: 'OVHcloud Node' }),
            makeValidator({ validator: '0xAWS', name: 'AWS Node' }),
        ];
        const ovh: HyperliquidOVHValidator[] = [{
            ...validators[0],
            detectionMethod: 'name-match',
            matchedText: 'OVHcloud Node',
        }];
        const metrics = calculateHyperliquidMetrics(validators, ovh);
        // 1 OVH out of 2 active = 50%
        expect(metrics.marketShare).toBeCloseTo(50, 0);
        expect(metrics.ovhValidators).toBe(1);
    });

    it('computes total stake from active validators only', () => {
        const validators = [
            makeValidator({ validator: '0xACT', isActive: true, stake: 200_000_000 }),
            makeValidator({ validator: '0xJAIL', isActive: false, isJailed: true, stake: 100_000_000 }),
        ];
        const metrics = calculateHyperliquidMetrics(validators, []);
        // Only the active validator's stake should be summed
        expect(metrics.totalStake).toBe(200_000_000);
    });
});

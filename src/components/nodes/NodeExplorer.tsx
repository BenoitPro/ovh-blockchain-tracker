'use client';

import { EnrichedNode } from '@/types';
import GenericNodeExplorer, { NodeExplorerConfig } from './GenericNodeExplorer';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatLamports = (lamports?: number): string => {
    if (!lamports) return '0 SOL';
    const sol = lamports / 1_000_000_000;
    if (sol >= 1_000_000) return `${(sol / 1_000_000).toFixed(2)}M SOL`;
    if (sol >= 1_000) return `${(sol / 1_000).toFixed(1)}K SOL`;
    return `${sol.toFixed(0)} SOL`;
};

// ── Solana config ─────────────────────────────────────────────────────────────

const SOLANA_CONFIG: NodeExplorerConfig<EnrichedNode> = {
    apiEndpoint: '/api/nodes',
    accentColor: '#00F0FF',

    getKey: (n) => n.pubkey,
    getIdentifier: (n) => `${n.pubkey.slice(0, 8)}…${n.pubkey.slice(-8)}`,
    getName: (n) => n.name || 'Unknown Validator',
    getImage: (n) => n.image,

    getPrimaryMetric: (n) => n.activatedStake ?? 0,
    formatPrimaryMetric: (n, all) => {
        const total = all.reduce((s, x) => s + (x.activatedStake ?? 0), 0);
        const pct = n.activatedStake && total ? ((n.activatedStake / total) * 100).toFixed(2) : '0.00';
        return { main: formatLamports(n.activatedStake), sub: `${pct}%` };
    },

    formatCommission: (n) => `${n.commission ?? 'N/A'}%`,
    getCommissionValue: (n) => n.commission ?? 0,

    getProvider: (n) => n.provider || n.org || 'Unknown',
    getASN: (n) => n.asn || 'AS Unknown',
    getCountryCode: (n) => n.country || '',
    getCountryName: (n) => n.countryName || '',
    getFilterProvider: (n) => n.org || '',
    getFilterCountry: (n) => n.countryName || '',

    isOVH: (n) => !!(n.org?.toLowerCase().includes('ovh')),

    sortOptions: [
        { value: 'stake_desc', label: 'Stake (Highest First)' },
        { value: 'stake_asc', label: 'Stake (Lowest First)' },
        { value: 'commission_asc', label: 'Commission (Lowest First)' },
    ],
    sortNodes: (nodes, sortBy) => {
        const n = [...nodes];
        if (sortBy === 'stake_desc') n.sort((a, b) => (b.activatedStake ?? 0) - (a.activatedStake ?? 0));
        else if (sortBy === 'stake_asc') n.sort((a, b) => (a.activatedStake ?? 0) - (b.activatedStake ?? 0));
        else if (sortBy === 'commission_asc') n.sort((a, b) => (a.commission ?? 0) - (b.commission ?? 0));
        return n;
    },
    getOVHNodes: (nodes) => nodes.filter(n => n.org?.toLowerCase().includes('ovh') || n.provider?.toLowerCase().includes('ovh')),

    viewModeLabels: { all: 'Complete List', ovh: 'Top OVH Validators' },
    searchPlaceholder: 'Search by Validator, Pubkey, IP, Provider…',
    csvFilename: 'solana_nodes_export',
    csvHeaders: ['Validator Name', 'Pubkey', 'Vote Account', 'Stake (SOL)', 'Commission', 'Provider', 'ASN', 'Country', 'IP'],
    getCSVRow: (n) => [
        `"${n.name || 'Unknown'}"`,
        n.pubkey,
        n.votePubkey || '',
        String((n.activatedStake ?? 0) / 1e9),
        String(n.commission ?? 0),
        `"${n.provider || n.org || 'Unknown'}"`,
        n.asn || '',
        `"${n.countryName || 'Unknown'}"`,
        n.ip || '',
    ],
};

// ── Export ────────────────────────────────────────────────────────────────────

export default function NodeExplorer() {
    return <GenericNodeExplorer config={SOLANA_CONFIG} />;
}

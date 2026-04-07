'use client';

import { AvalancheOVHNode } from '@/types';
import GenericNodeExplorer, { NodeExplorerConfig } from './GenericNodeExplorer';
import { extractAvalancheIP } from '@/lib/avalanche/fetchPeers';

const AVAX_CONFIG: NodeExplorerConfig<AvalancheOVHNode> = {
    apiEndpoint: '/api/avalanche/nodes',
    accentColor: '#E84142',
    showFeeColumn: false,

    getKey: (n) => n.nodeID,
    // Sub-identifier: show reward address (P-avax1...) when available — this is the entity identifier
    getIdentifier: (n) => n.rewardAddress || n.nodeID,
    getName: (n) => {
        if (n.name) return n.name;
        // Fallback: short nodeID (last 10 chars) — no public name registry exists for Avalanche
        const id = n.nodeID.replace('NodeID-', '');
        return id.length > 12 ? `…${id.slice(-10)}` : id;
    },
    getImage: undefined,

    // Primary metric: stake in AVAX (nAVAX ÷ 1e9)
    // Note: getPrimaryMetric is used for relative ordering only (not displayed raw),
    // so parseInt precision loss only affects ranking of validators > ~9M AVAX.
    getPrimaryMetric: (n) => parseInt(n.stakeAmount || '0'),
    formatPrimaryMetric: (n) => {
        const nAvax = parseInt(n.stakeAmount || '0');
        if (nAvax === 0) {
            // Fallback to uptime when no stake data available
            return { main: `${(n.observedUptime ?? 0).toFixed(1)}%`, sub: 'uptime' };
        }
        const avax = nAvax / 1e9;
        const formatted = avax >= 1_000_000
            ? `${(avax / 1_000_000).toFixed(2)}M`
            : avax >= 1_000
            ? `${(avax / 1_000).toFixed(1)}K`
            : avax.toFixed(0);
        return { main: `${formatted} AVAX`, sub: 'staked' };
    },

    // Fee column hidden — these values won't render but must be provided
    formatCommission: () => '—',
    getCommissionValue: () => 50,

    getProvider: (n) => n.provider || 'Unknown',
    getASN: (n) => n.ipInfo?.asn || 'AS Unknown',
    getCountryCode: (n) => n.ipInfo?.country || '',
    getCountryName: (n) => n.ipInfo?.country_name || '',
    getFilterProvider: (n) => n.provider || '',
    getFilterCountry: (n) => n.ipInfo?.country_name || '',

    isOVH: (n) => (n.provider || '').toLowerCase().includes('ovh'),

    sortOptions: [
        { value: 'stake_desc', label: 'Stake (Highest First)' },
        { value: 'stake_asc', label: 'Stake (Lowest First)' },
        { value: 'uptime_desc', label: 'Uptime (Highest First)' },
        { value: 'provider_asc', label: 'Provider (A → Z)' },
    ],
    sortNodes: (nodes, sortBy) => {
        const n = [...nodes];
        if (sortBy === 'stake_desc') {
            n.sort((a, b) => {
                const sa = BigInt(a.stakeAmount || '0');
                const sb = BigInt(b.stakeAmount || '0');
                return sb > sa ? 1 : sb < sa ? -1 : 0;
            });
        } else if (sortBy === 'stake_asc') {
            n.sort((a, b) => {
                const sa = BigInt(a.stakeAmount || '0');
                const sb = BigInt(b.stakeAmount || '0');
                return sa > sb ? 1 : sa < sb ? -1 : 0;
            });
        } else if (sortBy === 'uptime_desc') {
            n.sort((a, b) => (b.observedUptime ?? 0) - (a.observedUptime ?? 0));
        } else if (sortBy === 'provider_asc') {
            n.sort((a, b) => (a.provider || '').localeCompare(b.provider || ''));
        }
        return n;
    },
    getOVHNodes: (nodes) => nodes.filter(n => (n.provider || '').toLowerCase().includes('ovh')),

    viewModeLabels: { all: 'All Providers', ovh: 'OVH Only' },
    searchPlaceholder: 'Search by Name, NodeID, IP, Provider, or Country…',
    csvFilename: 'avalanche_nodes_export',
    csvHeaders: ['Name', 'NodeID', 'IP', 'Stake (AVAX)', 'Delegation Fee (%)', 'Reward Address', 'Uptime (%)', 'Provider', 'ASN', 'Country'],
    getCSVRow: (n) => [
        `"${n.name || ''}"`,
        `"${n.nodeID}"`,
        extractAvalancheIP(n.ip) || n.ip,
        n.stakeAmount ? (parseInt(n.stakeAmount) / 1e9).toFixed(2) : '',
        n.delegationFee !== undefined ? n.delegationFee.toFixed(2) : '',
        n.rewardAddress || '',
        (n.observedUptime ?? 0).toFixed(2),
        `"${n.provider || 'Unknown'}"`,
        n.ipInfo?.asn || '',
        `"${n.ipInfo?.country_name || ''}"`,
    ],
};

export default function AvalancheNodeExplorer() {
    return <GenericNodeExplorer config={AVAX_CONFIG} />;
}

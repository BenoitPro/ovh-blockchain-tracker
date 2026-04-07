'use client';

import { SuiOVHNode } from '@/types/sui';
import GenericNodeExplorer, { NodeExplorerConfig } from './GenericNodeExplorer';

// ── Sui config ────────────────────────────────────────────────────────────────

const SUI_CONFIG: NodeExplorerConfig<SuiOVHNode> = {
    apiEndpoint: '/api/sui/nodes',
    accentColor: '#4DA2FF',

    getKey: (n) => n.suiAddress,
    getIdentifier: (n) => n.suiAddress,
    getName: (n) => n.name || 'Anonymous',
    getImage: undefined,

    getPrimaryMetric: (n) => parseInt(n.votingPower || '0'),
    formatPrimaryMetric: (n, all) => {
        const total = all.reduce((s, x) => s + parseInt(x.votingPower || '0'), 0);
        const pct = total > 0 ? ((parseInt(n.votingPower) / total) * 100).toFixed(2) : '0';
        return { main: n.votingPower, sub: `${pct}% Share` };
    },

    formatCommission: (n) => `${(parseInt(n.commissionRate) / 100).toFixed(1)}%`,
    getCommissionValue: (n) => parseInt(n.commissionRate) / 100,

    getProvider: (n) => n.provider || 'Unknown',
    getASN: (n) => n.ipInfo?.asn || 'AS Unknown',
    getCountryCode: (n) => n.ipInfo?.country || '',
    getCountryName: (n) => n.ipInfo?.country_name || '',
    getFilterProvider: (n) => n.provider || '',
    getFilterCountry: (n) => n.ipInfo?.country_name || '',

    isOVH: (n) => (n.provider || '').toLowerCase().includes('ovh'),

    sortOptions: [
        { value: 'voting_power_desc', label: 'Voting Power (Highest First)' },
        { value: 'voting_power_asc', label: 'Voting Power (Lowest First)' },
        { value: 'commission_asc', label: 'Commission (Lowest First)' },
    ],
    sortNodes: (nodes, sortBy) => {
        const n = [...nodes];
        if (sortBy === 'voting_power_desc') n.sort((a, b) => parseInt(b.votingPower) - parseInt(a.votingPower));
        else if (sortBy === 'voting_power_asc') n.sort((a, b) => parseInt(a.votingPower) - parseInt(b.votingPower));
        else if (sortBy === 'commission_asc') n.sort((a, b) => parseInt(a.commissionRate) - parseInt(b.commissionRate));
        return n;
    },
    getOVHNodes: (nodes) => nodes.filter(n => (n.provider || '').toLowerCase().includes('ovh')),

    viewModeLabels: { all: 'All Providers', ovh: 'OVH Only' },
    searchPlaceholder: 'Search Sui Validators by Name, Address, IP, or Provider…',
    csvFilename: 'sui_validators_export',
    csvHeaders: ['Validator Name', 'Sui Address', 'Voting Power', 'Commission (bps)', 'Provider', 'ASN', 'Country', 'IP'],
    getCSVRow: (n) => [
        `"${n.name || 'Unknown'}"`,
        n.suiAddress,
        n.votingPower,
        n.commissionRate,
        `"${n.provider || 'Unknown'}"`,
        n.ipInfo?.asn || '',
        `"${n.ipInfo?.country_name || ''}"`,
        n.ip || '',
    ],
};

// ── Export ────────────────────────────────────────────────────────────────────

export default function SuiNodeExplorer() {
    return <GenericNodeExplorer config={SUI_CONFIG} />;
}

'use client';

import { AvalancheOVHNode } from '@/types';
import GenericNodeExplorer, { NodeExplorerConfig } from './GenericNodeExplorer';
import { extractAvalancheIP } from '@/lib/avalanche/fetchPeers';

const AVAX_CONFIG: NodeExplorerConfig<AvalancheOVHNode> = {
    apiEndpoint: '/api/avalanche/nodes',
    accentColor: '#E84142', // Avalanche red

    getKey: (n) => n.nodeID,
    getIdentifier: (n) => n.nodeID,
    getName: (n) => {
        // Show short nodeID (last 8 chars) as display name since peers have no human name
        const id = n.nodeID.replace('NodeID-', '');
        return id.length > 12 ? `…${id.slice(-10)}` : id;
    },
    getImage: undefined,

    getPrimaryMetric: (n) => n.observedUptime ?? 0,
    formatPrimaryMetric: (n) => ({
        main: `${(n.observedUptime ?? 0).toFixed(1)}%`,
        sub: 'uptime',
    }),

    // No commission concept in Avalanche — repurpose column for client version
    formatCommission: (n) => {
        const v = (n.version || '').replace('avalanche/', 'v');
        return v || '—';
    },
    getCommissionValue: () => 50, // neutral styling

    getProvider: (n) => n.provider || 'Unknown',
    getASN: (n) => n.ipInfo?.asn || 'AS Unknown',
    getCountryCode: (n) => n.ipInfo?.country || '',
    getCountryName: (n) => n.ipInfo?.country_name || '',
    getFilterProvider: (n) => n.provider || '',
    getFilterCountry: (n) => n.ipInfo?.country_name || '',

    isOVH: (n) => (n.provider || '').toLowerCase().includes('ovh'),

    sortOptions: [
        { value: 'uptime_desc', label: 'Uptime (Highest First)' },
        { value: 'uptime_asc', label: 'Uptime (Lowest First)' },
        { value: 'provider_asc', label: 'Provider (A → Z)' },
    ],
    sortNodes: (nodes, sortBy) => {
        const n = [...nodes];
        if (sortBy === 'uptime_desc') n.sort((a, b) => (b.observedUptime ?? 0) - (a.observedUptime ?? 0));
        else if (sortBy === 'uptime_asc') n.sort((a, b) => (a.observedUptime ?? 0) - (b.observedUptime ?? 0));
        else if (sortBy === 'provider_asc') n.sort((a, b) => (a.provider || '').localeCompare(b.provider || ''));
        return n;
    },
    getOVHNodes: (nodes) => nodes.filter(n => (n.provider || '').toLowerCase().includes('ovh')),

    viewModeLabels: { all: 'All Providers', ovh: 'OVH Only' },
    searchPlaceholder: 'Search by NodeID, IP, Provider, Version, or Country…',
    csvFilename: 'avalanche_nodes_export',
    csvHeaders: ['NodeID', 'IP', 'Version', 'Uptime (%)', 'Provider', 'ASN', 'Country'],
    getCSVRow: (n) => [
        `"${n.nodeID}"`,
        extractAvalancheIP(n.ip) || n.ip,
        `"${n.version || ''}"`,
        (n.observedUptime ?? 0).toFixed(2),
        `"${n.provider || 'Unknown'}"`,
        n.ipInfo?.asn || '',
        `"${n.ipInfo?.country_name || ''}"`,
    ],
};

export default function AvalancheNodeExplorer() {
    return <GenericNodeExplorer config={AVAX_CONFIG} />;
}

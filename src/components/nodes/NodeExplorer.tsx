'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { EnrichedNode } from '@/types';
import { MagnifyingGlassIcon, ServerIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import NodeDetails from './NodeDetails';
import ValidatorsList from '../dashboard/ValidatorsList';

interface NodeExplorerProps {
    initialNodes: EnrichedNode[];
}

const ROWS_PER_PAGE = 50;

// Helper to get flag emoji from country code
const getFlagEmoji = (countryCode?: string) => {
    if (!countryCode) return '🌐';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

export default function NodeExplorer({ initialNodes }: NodeExplorerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<EnrichedNode | null>(null);
    const [visibleCount, setVisibleCount] = useState(ROWS_PER_PAGE);

    // View Mode and Sort
    const [viewMode, setViewMode] = useState<'table' | 'top_ovh'>('table');
    const [sortBy, setSortBy] = useState<'stake_desc' | 'stake_asc' | 'commission_asc'>('stake_desc');

    // Filters
    const [providerFilter, setProviderFilter] = useState('All');
    const [countryFilter, setCountryFilter] = useState('All');

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(ROWS_PER_PAGE);
    }, [searchQuery, providerFilter, countryFilter]);

    // Format Lambda to SOL (with K/M suffix)
    const formatLamports = (lamports?: number) => {
        if (!lamports) return '0 SOL';
        const sol = lamports / 1_000_000_000;
        if (sol >= 1_000_000) return `${(sol / 1_000_000).toFixed(2)}M SOL`;
        if (sol >= 1_000) return `${(sol / 1_000).toFixed(1)}K SOL`;
        return `${sol.toFixed(0)} SOL`;
    };

    // Extract unique values for filters
    const uniqueProviders = useMemo(() => {
        const providers = new Set(initialNodes.map(n => n.org).filter(Boolean));
        return ['All', ...Array.from(providers).sort()];
    }, [initialNodes]);

    const uniqueCountries = useMemo(() => {
        const countries = new Set(initialNodes.map(n => n.countryName).filter(Boolean));
        return ['All', ...Array.from(countries).sort()];
    }, [initialNodes]);

    // Calculate total network stake for % calculation
    const totalStake = useMemo(() => {
        return initialNodes.reduce((acc, node) => acc + (node.activatedStake || 0), 0);
    }, [initialNodes]);

    const filteredNodes = useMemo(() => {
        let nodes = initialNodes;

        // Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            nodes = nodes.filter(node =>
                node.pubkey.toLowerCase().includes(query) ||
                node.name?.toLowerCase().includes(query) ||
                node.ip?.toLowerCase().includes(query) ||
                node.org?.toLowerCase().includes(query) ||
                node.asn?.toLowerCase().includes(query) ||
                node.votePubkey?.toLowerCase().includes(query)
            );
        }

        // Provider Filter
        if (providerFilter !== 'All') {
            nodes = nodes.filter(node => node.org === providerFilter);
        }

        // Country Filter
        if (countryFilter !== 'All') {
            nodes = nodes.filter(node => node.countryName === countryFilter);
        }

        return nodes;
    }, [initialNodes, searchQuery, providerFilter, countryFilter]);

    const sortedOvhNodes = useMemo(() => {
        let ovhNodes = initialNodes.filter(n => n.org?.toLowerCase().includes('ovh') || n.provider?.toLowerCase().includes('ovh'));
        if (sortBy === 'stake_desc') {
            ovhNodes.sort((a, b) => (b.activatedStake || 0) - (a.activatedStake || 0));
        } else if (sortBy === 'stake_asc') {
            ovhNodes.sort((a, b) => (a.activatedStake || 0) - (b.activatedStake || 0));
        } else if (sortBy === 'commission_asc') {
            ovhNodes.sort((a, b) => (a.commission || 0) - (b.commission || 0));
        }
        return ovhNodes;
    }, [initialNodes, sortBy]);

    const visibleNodes = filteredNodes.slice(0, visibleCount);
    const hasMore = visibleNodes.length < filteredNodes.length;

    const loadMore = () => {
        setVisibleCount(prev => prev + ROWS_PER_PAGE);
    };

    const downloadCSV = () => {
        const headers = ['Validator Name', 'Pubkey', 'Vote Account', 'Stake (SOL)', 'Commission', 'Provider', 'ASN', 'Country', 'IP'];
        const csvContent = [
            headers.join(','),
            ...filteredNodes.map(node => [
                `"${node.name || 'Unknown'}"`,
                node.pubkey,
                node.votePubkey || '',
                (node.activatedStake || 0) / 1e9,
                node.commission || 0,
                `"${node.provider || node.org || 'Unknown'}"`,
                node.asn || '',
                `"${node.countryName || 'Unknown'}"`,
                node.ip || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `solana_nodes_export_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="relative">
            {/* Controls Header */}
            <div className="flex flex-col gap-4 mb-8">
                {/* Top Row: Search + Stats + Export */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-white/30 group-focus-within:text-[#00F0FF] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Validator, Pubkey, IP, Provider..."
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00F0FF]/50 transition-all backdrop-blur-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={downloadCSV}
                        className="flex items-center justify-center space-x-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all whitespace-nowrap"
                    >
                        <span className="text-sm font-bold uppercase tracking-widest">Export CSV</span>
                    </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 mb-2 w-max">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'table' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-white/40 hover:text-white/80'}`}
                    >
                        Complete List
                    </button>
                    <button
                        onClick={() => setViewMode('top_ovh')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'top_ovh' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-white/40 hover:text-white/80'}`}
                    >
                        Top OVH Validators
                    </button>
                </div>

                {/* Filters Row */}
                {viewMode === 'table' ? (
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center space-x-2 text-white/40 text-sm font-bold uppercase tracking-widest">
                            <FunnelIcon className="h-4 w-4" />
                            <span>Filters:</span>
                        </div>

                        {/* Provider Dropdown */}
                        <div className="relative">
                            <select
                                value={providerFilter}
                                onChange={(e) => setProviderFilter(e.target.value)}
                                className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer hover:bg-white/5 transition-all w-48 truncate"
                            >
                                {uniqueProviders.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                        </div>

                        {/* Country Dropdown */}
                        <div className="relative">
                            <select
                                value={countryFilter}
                                onChange={(e) => setCountryFilter(e.target.value)}
                                className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer hover:bg-white/5 transition-all w-48 truncate"
                            >
                                {uniqueCountries.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                        </div>

                        {/* Active Filters Summary */}
                        {(providerFilter !== 'All' || countryFilter !== 'All' || searchQuery) && (
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-xs text-[#00F0FF] font-mono">
                                    {filteredNodes.length} nodes found
                                </span>
                                <button
                                    onClick={() => {
                                        setProviderFilter('All');
                                        setCountryFilter('All');
                                        setSearchQuery('');
                                    }}
                                    className="text-xs text-white/40 hover:text-white underline"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                        <div className="flex items-center space-x-2 text-white/40 text-sm font-bold uppercase tracking-widest">
                            <FunnelIcon className="h-4 w-4" />
                            <span>Sort Top OVH By:</span>
                        </div>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer hover:bg-white/5 transition-all w-48 truncate"
                            >
                                <option value="stake_desc">Stake (Highest First)</option>
                                <option value="stake_asc">Stake (Lowest First)</option>
                                <option value="commission_asc">Commission (Lowest First)</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>

            {viewMode === 'table' ? (
                <>
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 border-y border-white/10 text-xs font-bold text-white/40 uppercase tracking-widest mb-2 sticky top-0 z-10 backdrop-blur-xl">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Validator Identity</div>
                        <div className="col-span-2 text-right">Active Stake</div>
                        <div className="col-span-1 text-center">Fee</div>
                        <div className="col-span-2">Provider</div>
                        <div className="col-span-2 text-right">Location</div>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1">
                        {visibleNodes.map((node, index) => {
                            const isOVH = node.org?.toLowerCase().includes('ovh');
                            const stakePercentage = node.activatedStake && totalStake ? ((node.activatedStake / totalStake) * 100).toFixed(2) : '0.00';
                            const flag = getFlagEmoji(node.country);

                            return (
                                <div
                                    key={node.pubkey}
                                    onClick={() => setSelectedNode(node)}
                                    className={`
                                group relative grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center rounded-xl transition-all cursor-pointer border
                                ${isOVH
                                            ? 'bg-[#00F0FF]/5 border-[#00F0FF]/20 hover:bg-[#00F0FF]/10'
                                            : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                                        }
                            `}
                                >
                                    {/* OVH Badge */}
                                    {isOVH && (
                                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-[#00F0FF] rounded-r-full shadow-[0_0_10px_#00F0FF]"></div>
                                    )}

                                    {/* Rank */}
                                    <div className="col-span-1 font-mono text-white/30 text-sm">{index + 1}</div>

                                    {/* Validator Identity */}
                                    <div className="col-span-4 flex items-center space-x-3 overflow-hidden">
                                        <div className={`p-2 rounded-lg flex-shrink-0 relative overflow-hidden ${isOVH ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-white/5 text-white/30 group-hover:text-white transition-colors'}`}>
                                            {node.image ? (
                                                <Image src={node.image} alt={node.name || ''} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                                            ) : (
                                                <ServerIcon className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-sm truncate group-hover:text-[#00F0FF] transition-colors">
                                                {node.name || 'Unknown Validator'}
                                            </p>
                                            <p className="text-xs text-white/30 truncate font-mono">
                                                {node.pubkey.slice(0, 8)}...{node.pubkey.slice(-8)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stake */}
                                    <div className="col-span-2 text-right">
                                        <p className="text-white font-mono text-sm">{formatLamports(node.activatedStake)}</p>
                                        <p className="text-xs text-white/30">{stakePercentage}%</p>
                                    </div>

                                    {/* Commission */}
                                    <div className="col-span-1 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-md ${(node.commission || 0) === 100
                                            ? 'bg-red-500/20 text-red-400'
                                            : (node.commission || 0) === 0
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-white/10 text-white/60'
                                            }`}>
                                            {node.commission ?? 'N/A'}%
                                        </span>
                                    </div>

                                    {/* Provider */}
                                    <div className="col-span-2 min-w-0">
                                        <p className={`text-sm truncate ${isOVH ? 'text-[#00F0FF] font-medium' : 'text-white/70'}`}>
                                            {node.provider || node.org || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-white/30 truncate">{node.asn || 'AS Unknown'}</p>
                                    </div>

                                    {/* Location */}
                                    <div className="col-span-2 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <span className="text-2xl" title={node.countryName}>{flag}</span>
                                            <span className="text-white/60 text-xs hidden lg:inline-block">{node.country || 'UNK'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Load More Trigger */}
                        {hasMore && (
                            <div className="pt-8 pb-4 text-center">
                                <button
                                    onClick={loadMore}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all text-sm uppercase tracking-widest"
                                >
                                    Load More Nodes ({filteredNodes.length - visibleCount} remaining)
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="max-w-4xl mx-auto w-full">
                    <ValidatorsList validators={sortedOvhNodes} />
                </div>
            )}

            {/* Node Details Modal/Slide-over */}
            {selectedNode && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedNode(null)}
                    ></div>

                    {/* Drawer */}
                    <div className="relative w-full max-w-2xl h-full bg-[#050510] border-l border-white/10 shadow-2xl overflow-y-auto transform transition-transform animate-slide-in-right">
                        <button
                            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10"
                            onClick={() => setSelectedNode(null)}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <NodeDetails node={selectedNode} />
                    </div>
                </div>
            )}
        </div>
    );
}

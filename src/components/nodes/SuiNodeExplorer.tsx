'use client';

import { useState, useMemo, useEffect } from 'react';
import { SuiOVHNode } from '@/types/sui';
import { MagnifyingGlassIcon, ServerIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import { CHAINS } from '@/lib/chains';

const ROWS_PER_PAGE = 50;
const SUI_BLUE = '#4DA2FF';

// Helper to get flag emoji from country code
const getFlagEmoji = (countryCode?: string) => {
    if (!countryCode || countryCode === 'Unknown') return '🌐';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

export default function SuiNodeExplorer() {
    const { theme } = useNetworkTheme();
    const [nodes, setNodes] = useState<SuiOVHNode[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    
    // View Mode and Sort
    const [viewMode, setViewMode] = useState<'table' | 'top_ovh'>('table');
    const [sortBy, setSortBy] = useState<'voting_power_desc' | 'voting_power_asc' | 'commission_asc'>('voting_power_desc');

    // Filters
    const [providerFilter, setProviderFilter] = useState('All');
    const [countryFilter, setCountryFilter] = useState('All');

    const fetchNodes = async (pageNum: number, search: string, isAppend: boolean = false) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sui/nodes?page=${pageNum}&limit=${ROWS_PER_PAGE}&search=${encodeURIComponent(search)}`);
            const data = await res.json();
            if (data.success) {
                setNodes(prev => isAppend ? [...prev, ...data.nodes] : data.nodes);
                setTotal(data.total);
            }
        } catch (err) {
            console.error('Failed to fetch Sui nodes:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchNodes(1, searchQuery, false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Extract unique values for filters (from what we have so far)
    const uniqueProviders = useMemo(() => {
        const providers = new Set(nodes.map(n => n.provider).filter(Boolean));
        return ['All', ...Array.from(providers).sort()];
    }, [nodes]);

    const uniqueCountries = useMemo(() => {
        const countries = new Set(nodes.map(n => n.ipInfo.country_name).filter(Boolean));
        return ['All', ...Array.from(countries).sort()];
    }, [nodes]);

    // Total voting power for visible/loaded nodes
    const loadedVotingPower = useMemo(() => {
        return nodes.reduce((acc, node) => acc + parseInt(node.votingPower || '0'), 0);
    }, [nodes]);

    const filteredNodes = useMemo(() => {
        let n = nodes;
        if (providerFilter !== 'All') n = n.filter(node => node.provider === providerFilter);
        if (countryFilter !== 'All') n = n.filter(node => node.ipInfo.country_name === countryFilter);
        
        // Local sort
        const sorted = [...n];
        if (sortBy === 'voting_power_desc') sorted.sort((a,b) => parseInt(b.votingPower) - parseInt(a.votingPower));
        else if (sortBy === 'voting_power_asc') sorted.sort((a,b) => parseInt(a.votingPower) - parseInt(b.votingPower));
        else if (sortBy === 'commission_asc') sorted.sort((a,b) => parseInt(a.commissionRate) - parseInt(b.commissionRate));

        return sorted;
    }, [nodes, providerFilter, countryFilter, sortBy]);

    const ovhNodes = useMemo(() => {
        return nodes.filter(n => (n.provider || '').toLowerCase().includes('ovh'));
    }, [nodes]);

    const visibleNodes = viewMode === 'table' ? filteredNodes : ovhNodes.sort((a, b) => parseInt(b.votingPower) - parseInt(a.votingPower));
    const hasMore = nodes.length < total;

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNodes(nextPage, searchQuery, true);
    };

    const downloadCSV = () => {
        const headers = ['Validator Name', 'Sui Address', 'Voting Power', 'Commission (bps)', 'Provider', 'ASN', 'Country', 'IP'];
        const csvContent = [
            headers.join(','),
            ...nodes.map(node => [
                `"${node.name || 'Unknown'}"`,
                node.suiAddress,
                node.votingPower,
                node.commissionRate,
                `"${node.provider || 'Unknown'}"`,
                node.ipInfo.asn,
                `"${node.ipInfo.country_name}"`,
                node.ip || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', `sui_validators_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
                {/* Search Row */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-white/30 group-focus-within:text-[#4DA2FF] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search Sui Validators by Name, Address, IP, or Provider..."
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#4DA2FF]/50 transition-all backdrop-blur-sm"
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

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 w-max shrink-0">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'table' ? 'bg-[#4DA2FF]/20 text-[#4DA2FF]' : 'text-white/40 hover:text-white/80'}`}
                        >
                            All Providers
                        </button>
                        <button
                            onClick={() => setViewMode('top_ovh')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'top_ovh' ? 'bg-[#4DA2FF]/20 text-[#4DA2FF]' : 'text-white/40 hover:text-white/80'}`}
                        >
                            OVH Only
                        </button>
                    </div>

                    {viewMode === 'table' && (
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="flex items-center space-x-1 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                                <FunnelIcon className="h-3.5 w-3.5 mr-1" />
                                <span>Filter:</span>
                            </div>

                            <div className="relative">
                                <select
                                    value={providerFilter}
                                    onChange={(e) => setProviderFilter(e.target.value)}
                                    className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-xs focus:outline-none focus:border-[#4DA2FF]/50 cursor-pointer hover:bg-white/5 transition-all w-44 truncate"
                                >
                                    {uniqueProviders.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
                            </div>

                            <div className="relative">
                                <select
                                    value={countryFilter}
                                    onChange={(e) => setCountryFilter(e.target.value)}
                                    className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-xs focus:outline-none focus:border-[#4DA2FF]/50 cursor-pointer hover:bg-white/5 transition-all w-44 truncate"
                                >
                                    {uniqueCountries.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Network Table */}
            <div className="glass-card overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-white/[0.03] border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-4">Validator Identity</div>
                    <div className="col-span-2 text-right">Voting Power</div>
                    <div className="col-span-1 text-center">Comm.</div>
                    <div className="col-span-2">Provider</div>
                    <div className="col-span-2 text-right">Location</div>
                </div>

                <div className="divide-y divide-white/5">
                    {loading && nodes.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-[#4DA2FF]/30 border-t-[#4DA2FF] rounded-full mx-auto mb-4"></div>
                            <p className="text-white/40">Loading network...</p>
                        </div>
                    ) : (
                        visibleNodes.map((node, index) => {
                            const isOVH = (node.provider || '').toLowerCase().includes('ovh');
                            const powerPct = loadedVotingPower > 0 ? ((parseInt(node.votingPower) / loadedVotingPower) * 100).toFixed(2) : '0';
                            const flag = getFlagEmoji(node.ipInfo.country);

                            return (
                                <div key={node.suiAddress} className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 items-center transition-all hover:bg-white/[0.02] group ${isOVH ? 'bg-[#4DA2FF]/5' : ''}`}>
                                    <div className="col-span-1 font-mono text-xs text-white/30">{index + 1}</div>
                                    
                                    <div className="col-span-4 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg shrink-0 ${isOVH ? 'bg-[#4DA2FF]/20 text-[#4DA2FF]' : 'bg-white/5 text-white/40 group-hover:text-white transition-colors'}`}>
                                                <ServerIcon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white font-bold text-sm truncate group-hover:text-[#4DA2FF] transition-colors">{node.name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-white/20 font-mono truncate">{node.suiAddress}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <p className="text-white font-mono text-sm">{node.votingPower}</p>
                                        <p className="text-[10px] text-white/30 uppercase tracking-tighter">{powerPct}% Share</p>
                                    </div>

                                    <div className="col-span-1 text-center">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 font-mono">
                                            {(parseInt(node.commissionRate) / 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    <div className="col-span-2 min-w-0">
                                        <p className={`text-sm truncate ${isOVH ? 'text-[#4DA2FF] font-bold' : 'text-white/60'}`}>{node.provider || 'Unknown'}</p>
                                        <p className="text-[10px] text-white/20 truncate font-mono">{node.ipInfo.asn}</p>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-white font-medium text-xs hidden lg:block">{node.ipInfo.country_name}</span>
                                            <span className="text-xl" title={node.ipInfo.country_name}>{flag}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {hasMore && (
                    <div className="p-8 text-center border-t border-white/5">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all text-sm uppercase tracking-widest font-bold"
                        >
                            {loading ? 'Loading...' : `Load More Validators (${total - nodes.length} remaining)`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

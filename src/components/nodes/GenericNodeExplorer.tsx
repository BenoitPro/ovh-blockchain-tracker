'use client';

import { useState, useMemo, useEffect } from 'react';
import { MagnifyingGlassIcon, ServerIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import EntityMethodologyButton from './EntityMethodologyButton';


const ROWS_PER_PAGE = 50;

const getFlagEmoji = (countryCode?: string) => {
    if (!countryCode || countryCode === 'Unknown') return '🌐';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

// ── Config interface ──────────────────────────────────────────────────────────

export interface NodeExplorerConfig<T> {
    // Data fetching
    apiEndpoint: string;

    // Node identity
    getKey: (node: T) => string;
    getIdentifier: (node: T) => string;        // short identifier displayed under name
    getName: (node: T) => string;
    getImage?: (node: T) => string | undefined;

    // Primary metric (stake / voting power)
    getPrimaryMetric: (node: T) => number;
    formatPrimaryMetric: (node: T, allNodes: T[]) => { main: string; sub: string };

    // Commission
    formatCommission: (node: T) => string;
    getCommissionValue: (node: T) => number;   // raw number for color-coding

    // Provider / location
    getProvider: (node: T) => string;
    getASN: (node: T) => string;
    getCountryCode: (node: T) => string;
    getCountryName: (node: T) => string;
    getFilterProvider: (node: T) => string;    // field used for provider filter dropdown
    getFilterCountry: (node: T) => string;     // field used for country filter dropdown

    // OVH detection
    isOVH: (node: T) => boolean;

    // Theme
    accentColor: string;

    // Sort
    sortOptions: Array<{ value: string; label: string }>;
    sortNodes: (nodes: T[], sortBy: string) => T[];
    getOVHNodes: (nodes: T[]) => T[];

    // Labels / text
    viewModeLabels: { all: string; ovh: string };
    searchPlaceholder: string;
    csvFilename: string;
    csvHeaders: string[];
    getCSVRow: (node: T) => string[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GenericNodeExplorer<T>({ config }: { config: NodeExplorerConfig<T> }) {
    const { accentColor } = config;

    const [nodes, setNodes] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'top_ovh'>('table');
    const [sortBy, setSortBy] = useState(config.sortOptions[0]?.value ?? '');
    const [providerFilter, setProviderFilter] = useState('All');
    const [countryFilter, setCountryFilter] = useState('All');

    const fetchNodes = async (pageNum: number, search: string, append = false) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${config.apiEndpoint}?page=${pageNum}&limit=${ROWS_PER_PAGE}&search=${encodeURIComponent(search)}`
            );
            const data = await res.json();
            if (data.success) {
                setNodes(prev => append ? [...prev, ...data.nodes] : data.nodes);
                setTotal(data.total);
            }
        } catch (err) {
            console.error('Failed to fetch nodes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { setPage(1); fetchNodes(1, searchQuery, false); }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const uniqueProviders = useMemo(() => {
        const set = new Set(nodes.map(config.getFilterProvider).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [nodes]);

    const uniqueCountries = useMemo(() => {
        const set = new Set(nodes.map(config.getFilterCountry).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [nodes]);

    const filteredNodes = useMemo(() => {
        let n = nodes;
        if (providerFilter !== 'All') n = n.filter(node => config.getFilterProvider(node) === providerFilter);
        if (countryFilter !== 'All') n = n.filter(node => config.getFilterCountry(node) === countryFilter);
        return config.sortNodes(n, sortBy);
    }, [nodes, providerFilter, countryFilter, sortBy]);

    const ovhNodes = useMemo(() => config.getOVHNodes(nodes), [nodes]);
    const visibleNodes = viewMode === 'table' ? filteredNodes : ovhNodes;
    const hasMore = nodes.length < total;

    const loadMore = () => { const next = page + 1; setPage(next); fetchNodes(next, searchQuery, true); };

    const downloadCSV = () => {
        const csvContent = [
            config.csvHeaders.join(','),
            ...nodes.map(node => config.getCSVRow(node).join(',')),
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `${config.csvFilename}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Inline style for accent color (avoids string interpolation in Tailwind classes)
    const accentStyle = { color: accentColor };
    const accentBorderStyle = { borderColor: `${accentColor}80` };
    const accentBgStyle = { backgroundColor: `${accentColor}1A` };

    return (
        <div className="relative">
            {/* Controls */}
            <div className="flex flex-col gap-4 mb-8">
                {/* Search + Export */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-white/30 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder={config.searchPlaceholder}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none transition-all backdrop-blur-sm"
                            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center justify-center px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all whitespace-nowrap"
                    >
                        <span className="text-sm font-bold uppercase tracking-widest">Export CSV</span>
                    </button>
                </div>

                {/* View mode toggle */}
                <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 w-max">
                    <button
                        onClick={() => setViewMode('table')}
                        className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                        style={viewMode === 'table' ? { ...accentBgStyle, ...accentStyle } : { color: 'rgba(255,255,255,0.4)' }}
                    >
                        {config.viewModeLabels.all}
                    </button>
                    <button
                        onClick={() => setViewMode('top_ovh')}
                        className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                        style={viewMode === 'top_ovh' ? { ...accentBgStyle, ...accentStyle } : { color: 'rgba(255,255,255,0.4)' }}
                    >
                        {config.viewModeLabels.ovh}
                    </button>
                </div>

                {/* Filters / Sort */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center space-x-2 text-white/40 text-sm font-bold uppercase tracking-widest">
                        <FunnelIcon className="h-4 w-4" />
                        <span>{viewMode === 'table' ? 'Filters:' : 'Sort by:'}</span>
                    </div>

                    {viewMode === 'table' ? (
                        <>
                            <div className="relative">
                                <select
                                    value={providerFilter}
                                    onChange={(e) => setProviderFilter(e.target.value)}
                                    className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none cursor-pointer hover:bg-white/5 transition-all w-48 truncate"
                                >
                                    {uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select
                                    value={countryFilter}
                                    onChange={(e) => setCountryFilter(e.target.value)}
                                    className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none cursor-pointer hover:bg-white/5 transition-all w-48 truncate"
                                >
                                    {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                            </div>
                            {(providerFilter !== 'All' || countryFilter !== 'All' || searchQuery) && (
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-xs font-mono" style={accentStyle}>{total} nodes found</span>
                                    <button
                                        onClick={() => { setProviderFilter('All'); setCountryFilter('All'); setSearchQuery(''); }}
                                        className="text-xs text-white/40 hover:text-white underline"
                                    >Clear All</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none cursor-pointer hover:bg-white/5 transition-all w-56 truncate"
                            >
                                {config.sortOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 border-y border-white/10 text-xs font-bold text-white/40 uppercase tracking-widest mb-2 sticky top-0 z-10 backdrop-blur-xl">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Identity</div>
                <div className="col-span-2 text-right">Metric</div>
                <div className="col-span-1 text-center">Fee</div>
                <div className="col-span-2">Provider</div>
                <div className="col-span-2 text-right">Location</div>
            </div>

            <div className="space-y-1">
                {loading && nodes.length === 0 ? (
                    <div className="py-20 text-center">
                        <div
                            className="animate-spin h-8 w-8 border-4 rounded-full mx-auto mb-4"
                            style={{ borderColor: `${accentColor}4D`, borderTopColor: accentColor }}
                        />
                        <p className="text-white/40">Loading nodes…</p>
                    </div>
                ) : (
                    <>
                        {visibleNodes.map((node, index) => {
                            const isOVH = config.isOVH(node);
                            const metric = config.formatPrimaryMetric(node, nodes);
                            const commission = config.formatCommission(node);
                            const commissionVal = config.getCommissionValue(node);
                            const flag = getFlagEmoji(config.getCountryCode(node));
                            const image = config.getImage?.(node);

                            return (
                                <div
                                    key={config.getKey(node)}
                                    className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center rounded-xl transition-all border"
                                    style={isOVH ? { ...accentBgStyle, ...accentBorderStyle } : { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.05)' }}
                                >
                                    {isOVH && (
                                        <div
                                            className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-r-full"
                                            style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
                                        />
                                    )}

                                    <div className="col-span-1 font-mono text-white/30 text-sm">{index + 1}</div>

                                    <div className="col-span-4 flex items-center space-x-3 overflow-hidden">
                                        <div
                                            className="p-2 rounded-lg flex-shrink-0"
                                            style={isOVH ? accentBgStyle : { backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        >
                                            {image ? (
                                                <img src={image} alt={config.getName(node)} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                                            ) : (
                                                <ServerIcon className="h-5 w-5" style={isOVH ? accentStyle : { color: 'rgba(255,255,255,0.3)' }} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-sm truncate">{config.getName(node) || 'Unknown'}</p>
                                            <p className="text-xs text-white/30 truncate font-mono">{config.getIdentifier(node)}</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <p className="text-white font-mono text-sm">{metric.main}</p>
                                        <p className="text-xs text-white/30">{metric.sub}</p>
                                    </div>

                                    <div className="col-span-1 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-md ${
                                            commissionVal >= 100 ? 'bg-red-500/20 text-red-400'
                                            : commissionVal === 0 ? 'bg-green-500/20 text-green-400'
                                            : 'bg-white/10 text-white/60'
                                        }`}>
                                            {commission}
                                        </span>
                                    </div>

                                    <div className="col-span-2 min-w-0">
                                        <p className="text-sm truncate" style={isOVH ? accentStyle : { color: 'rgba(255,255,255,0.7)' }}>
                                            {config.getProvider(node) || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-white/30 truncate">{config.getASN(node)}</p>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <span className="text-2xl" title={config.getCountryName(node)}>{flag}</span>
                                            <span className="text-white/60 text-xs hidden lg:inline-block">{config.getCountryCode(node)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {hasMore && (
                            <div className="pt-8 pb-4 text-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all text-sm uppercase tracking-widest flex items-center gap-2 mx-auto"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                            Loading…
                                        </>
                                    ) : `Load More (${total - nodes.length} remaining)`}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            <EntityMethodologyButton />
        </div>
    );
}

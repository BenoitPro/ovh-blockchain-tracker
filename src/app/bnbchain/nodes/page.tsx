'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    MagnifyingGlassIcon,
    ServerIcon,
    ChevronDownIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import ParticlesBackground from '@/components/ParticlesBackground';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import { BNBChainDashboardMetrics, BNBProviderDetail } from '@/types/bnbchain';

const BNB_GOLD = '#F3BA2F';
const OVH_CYAN = '#00F0FF';

const TIER_LABELS: Record<string, string> = {
    official: 'Official',
    professional: 'Professional',
    community: 'Community',
};

const TIER_COLORS: Record<string, string> = {
    official: BNB_GOLD,
    professional: '#60A5FA',
    community: '#9CA3AF',
};

/** Extract root domain from a hostname for favicon lookup */
function getRootDomain(hostname: string): string {
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    return parts.slice(-2).join('.');
}

function ProviderLogo({ hostname, name, isOVH }: { hostname: string; name: string; isOVH: boolean }) {
    const [imgError, setImgError] = useState(false);
    const domain = getRootDomain(hostname);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

    if (imgError) {
        return (
            <ServerIcon
                className="h-5 w-5"
                style={{ color: isOVH ? OVH_CYAN : 'rgba(255,255,255,0.3)' }}
            />
        );
    }

    return (
        <img
            src={faviconUrl}
            alt={name}
            width={20}
            height={20}
            className="w-5 h-5 rounded-full object-cover"
            onError={() => setImgError(true)}
        />
    );
}

function InfraBadge({ infra }: { infra: string }) {
    // Known providers get their brand color
    const knownColors: Record<string, string> = {
        OVHcloud: OVH_CYAN,
        AWS: '#FF9900',
        'Google Cloud': '#4285F4',
        Hetzner: '#D50C2D',
        DigitalOcean: '#0080FF',
        Vultr: '#007BFC',
    };
    // Cloudflare-like names
    const isCloudflare = infra.toLowerCase().includes('cloudflare');
    const color = isCloudflare ? '#F38020' : (knownColors[infra] ?? '#6B7280');

    const label = isCloudflare ? 'Cloudflare' : infra;

    return (
        <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
            style={{
                color,
                background: `${color}15`,
                border: `1px solid ${color}30`,
            }}
        >
            {label}
        </span>
    );
}

export default function BNBChainNodesPage() {
    const [metrics, setMetrics] = useState<BNBChainDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('tier');
    const [infraFilter, setInfraFilter] = useState('All');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/bnbchain');
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch data');
            setMetrics(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const details: BNBProviderDetail[] = metrics?.providerDetails ?? [];

    const uniqueInfra = useMemo(() => {
        const set = new Set(details.map(d => {
            if (d.infrastructure.toLowerCase().includes('cloudflare')) return 'Cloudflare';
            return d.infrastructure;
        }).filter(i => i !== 'Unknown'));
        return ['All', ...Array.from(set).sort()];
    }, [details]);

    const filtered = useMemo(() => {
        let list = [...details];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(d =>
                d.providerName.toLowerCase().includes(q) ||
                d.hostname.toLowerCase().includes(q) ||
                d.infrastructure.toLowerCase().includes(q)
            );
        }

        if (infraFilter !== 'All') {
            list = list.filter(d => {
                if (infraFilter === 'Cloudflare') return d.infrastructure.toLowerCase().includes('cloudflare');
                return d.infrastructure === infraFilter;
            });
        }

        // Sort
        const tierOrder = { official: 0, professional: 1, community: 2 };
        if (sortBy === 'tier') {
            list.sort((a, b) => {
                if (a.isOnOVH !== b.isOnOVH) return a.isOnOVH ? -1 : 1;
                const t = (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3);
                return t !== 0 ? t : b.ipCount - a.ipCount;
            });
        } else if (sortBy === 'ips') {
            list.sort((a, b) => b.ipCount - a.ipCount);
        } else if (sortBy === 'name') {
            list.sort((a, b) => a.providerName.localeCompare(b.providerName));
        } else if (sortBy === 'infra') {
            list.sort((a, b) => a.infrastructure.localeCompare(b.infrastructure));
        }

        return list;
    }, [details, searchQuery, infraFilter, sortBy]);

    const downloadCSV = () => {
        const rows = [
            ['RPC Provider', 'Hostname', 'Tier', 'IPs Resolved', 'Infrastructure', 'On OVH'].join(','),
            ...details.map(d => [
                `"${d.providerName}"`,
                d.hostname,
                d.tier,
                d.ipCount,
                `"${d.infrastructure}"`,
                d.isOnOVH ? 'Yes' : 'No',
            ].join(',')),
        ].join('\n');
        const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `bnb_rpc_providers_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen relative" style={{ background: '#0a0800' }}>
                <ParticlesBackground />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <LoadingState />
                </div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <>
                <ParticlesBackground />
                <ErrorState message={error || 'No data available'} onRetry={fetchData} />
            </>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: '#0a0800' }}>
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1400px]">
                {/* Header */}
                <div className="mb-8">
                    <h2
                        className="text-3xl font-bold bg-clip-text text-transparent"
                        style={{ backgroundImage: `linear-gradient(to right, ${BNB_GOLD}, #FFD97D)` }}
                    >
                        BNB Chain — RPC Provider Explorer
                    </h2>
                    <p className="text-white/50 mt-2 text-sm">
                        {details.length} professional RPC providers tracked
                        — representing ~{metrics.coverage.estimatedTrafficCoverage}% of BSC public API traffic.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-4 mb-8">
                    {/* Search + Export */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-white/30" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by provider name, hostname, or infrastructure…"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none transition-all backdrop-blur-sm"
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

                    {/* Filters / Sort */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center space-x-2 text-white/40 text-sm font-bold uppercase tracking-widest">
                            <FunnelIcon className="h-4 w-4" />
                            <span>Filters:</span>
                        </div>

                        <div className="relative">
                            <select
                                value={infraFilter}
                                onChange={(e) => setInfraFilter(e.target.value)}
                                className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none cursor-pointer hover:bg-white/5 transition-all w-48 truncate"
                            >
                                {uniqueInfra.map(i => <option key={i} value={i}>{i === 'All' ? 'All Infrastructure' : i}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none cursor-pointer hover:bg-white/5 transition-all w-48 truncate"
                            >
                                <option value="tier">Sort: Tier</option>
                                <option value="ips">Sort: IPs (most)</option>
                                <option value="name">Sort: Name (A→Z)</option>
                                <option value="infra">Sort: Infrastructure</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                        </div>

                        {(infraFilter !== 'All' || searchQuery) && (
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-xs font-mono" style={{ color: BNB_GOLD }}>
                                    {filtered.length} provider{filtered.length !== 1 ? 's' : ''} found
                                </span>
                                <button
                                    onClick={() => { setInfraFilter('All'); setSearchQuery(''); }}
                                    className="text-xs text-white/40 hover:text-white underline"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 border-y border-white/10 text-xs font-bold text-white/40 uppercase tracking-widest mb-2 sticky top-0 z-10 backdrop-blur-xl">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">RPC Provider</div>
                    <div className="col-span-1 text-center">IPs</div>
                    <div className="col-span-3">Infrastructure</div>
                    <div className="col-span-2 text-center">Tier</div>
                </div>

                {/* Rows */}
                <div className="space-y-1">
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-white/40">No providers match your filters.</p>
                        </div>
                    ) : (
                        filtered.map((detail, index) => {
                            const isOVH = detail.isOnOVH;
                            const tierColor = TIER_COLORS[detail.tier] ?? '#9CA3AF';

                            return (
                                <div
                                    key={detail.hostname}
                                    className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center rounded-xl transition-all border"
                                    style={isOVH
                                        ? { backgroundColor: `${OVH_CYAN}1A`, borderColor: `${OVH_CYAN}80` }
                                        : { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.05)' }
                                    }
                                >
                                    {/* OVH accent bar */}
                                    {isOVH && (
                                        <div
                                            className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-r-full"
                                            style={{ backgroundColor: OVH_CYAN, boxShadow: `0 0 10px ${OVH_CYAN}` }}
                                        />
                                    )}

                                    {/* # */}
                                    <div className="col-span-1 font-mono text-white/30 text-sm">
                                        {index + 1}
                                    </div>

                                    {/* Provider identity */}
                                    <div className="col-span-5 flex items-center space-x-3 overflow-hidden">
                                        <div
                                            className="p-2 rounded-lg flex-shrink-0"
                                            style={isOVH
                                                ? { backgroundColor: `${OVH_CYAN}1A` }
                                                : { backgroundColor: 'rgba(255,255,255,0.05)' }
                                            }
                                        >
                                            <ProviderLogo
                                                hostname={detail.hostname}
                                                name={detail.providerName}
                                                isOVH={isOVH}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-sm truncate">
                                                {detail.providerName}
                                            </p>
                                            <p className="text-xs text-white/30 truncate font-mono">
                                                {detail.hostname}
                                            </p>
                                        </div>
                                    </div>

                                    {/* IPs */}
                                    <div className="col-span-1 text-center">
                                        {detail.ipCount > 0 ? (
                                            <span className="text-sm text-white font-mono">{detail.ipCount}</span>
                                        ) : (
                                            <span className="text-xs text-red-400/60">0</span>
                                        )}
                                    </div>

                                    {/* Infrastructure */}
                                    <div className="col-span-3">
                                        {detail.ipCount > 0 ? (
                                            <InfraBadge infra={detail.infrastructure} />
                                        ) : (
                                            <span className="text-xs text-white/20 italic">DNS failed</span>
                                        )}
                                    </div>

                                    {/* Tier */}
                                    <div className="col-span-2 text-center">
                                        <span
                                            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                                            style={{
                                                color: tierColor,
                                                background: `${tierColor}15`,
                                                border: `1px solid ${tierColor}30`,
                                            }}
                                        >
                                            {TIER_LABELS[detail.tier] ?? detail.tier}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Scope note */}
                <div className="mt-8 px-4 py-3 rounded-xl border text-xs text-white/30" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    Scope: professional RPC providers only. Validators (~{metrics.totalValidators}) and private nodes
                    (~{metrics.coverage.totalNetworkEstimate.toLocaleString()}+) use private sentries — IPs not discoverable on BSC.
                    Infrastructure detected via MaxMind GeoLite2 ASN database.
                </div>
            </main>
        </div>
    );
}

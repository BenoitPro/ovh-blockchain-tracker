'use client';

import { useEffect, useState, useMemo } from 'react';
import ParticlesBackground from '@/components/ParticlesBackground';
import { MagnifyingGlassIcon, ServerIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { MonadDashboardMetrics, MonadValidator } from '@/types/monad';

const ACCENT = '#836EF9';

type SortKey = 'stake_desc' | 'stake_asc' | 'name_asc' | 'country_asc';

const getFlagEmoji = (countryCode?: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

function formatStake(stake: number): string {
    if (stake === 0) return '—';
    if (stake >= 1_000_000_000) return `${(stake / 1_000_000_000).toFixed(2)}B`;
    if (stake >= 1_000_000) return `${(stake / 1_000_000).toFixed(2)}M`;
    if (stake >= 1_000) return `${(stake / 1_000).toFixed(1)}K`;
    return stake.toLocaleString();
}

export default function MonadNodesPage() {
    const [metrics, setMetrics] = useState<MonadDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('stake_desc');
    const [countryFilter, setCountryFilter] = useState('All');

    useEffect(() => {
        fetch('/api/monad')
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) setMetrics(json.data);
                else setError(json.error ?? 'Failed to load data');
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, []);

    const validators: MonadValidator[] = metrics?.validators ?? [];

    const uniqueCountries = useMemo(() => {
        const set = new Set(validators.map(v => v.country).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [validators]);

    const filtered = useMemo(() => {
        let list = validators;
        if (countryFilter !== 'All') list = list.filter(v => v.country === countryFilter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(v =>
                v.name.toLowerCase().includes(q) ||
                v.country.toLowerCase().includes(q) ||
                v.city.toLowerCase().includes(q),
            );
        }
        const sorted = [...list];
        if (sortBy === 'stake_desc') sorted.sort((a, b) => b.stake - a.stake);
        else if (sortBy === 'stake_asc') sorted.sort((a, b) => a.stake - b.stake);
        else if (sortBy === 'name_asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'country_asc') sorted.sort((a, b) => a.country.localeCompare(b.country));
        return sorted;
    }, [validators, search, sortBy, countryFilter]);

    const hasFilters = search.trim() !== '' || countryFilter !== 'All';

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#08070f]">
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12">
                {/* ── Header ── */}
                <div className="mb-8">
                    <h2
                        className="text-3xl font-bold"
                        style={{
                            background: `linear-gradient(to right, ${ACCENT}, #a78bfa)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Monad Validator Explorer
                    </h2>
                    <p className="text-white/50 mt-2">
                        {loading
                            ? 'Loading validator data…'
                            : `${validators.length} validators · ${metrics?.activeValidators ?? 0} active · ${metrics?.countryCount ?? 0} countries`}
                    </p>
                </div>

                {/* ── Infrastructure note (compact) ── */}
                <div
                    className="rounded-xl border px-5 py-3 mb-8 flex items-start gap-3 text-sm"
                    style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}08` }}
                >
                    <span style={{ color: ACCENT }} className="mt-0.5 shrink-0">ℹ</span>
                    <span className="text-white/50 leading-relaxed">
                        IP / hosting-provider data unavailable — Monad uses a custom MonadBFT peer-discovery protocol.
                        Country, city and validator identities are sourced from{' '}
                        <a href="https://gmonads.com" target="_blank" rel="noopener noreferrer"
                            style={{ color: ACCENT }} className="underline hover:opacity-80">
                            gmonads.com
                        </a>.
                    </span>
                </div>

                {/* ── Controls ── */}
                <div className="flex flex-col gap-4 mb-8">
                    {/* Search + Export */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-white/30" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by validator name, country, city…"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none transition-all backdrop-blur-sm"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filters + Sort */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center space-x-2 text-white/40 text-sm font-bold uppercase tracking-widest">
                            <FunnelIcon className="h-4 w-4" />
                            <span>Filters:</span>
                        </div>

                        {/* Country filter */}
                        <div className="relative">
                            <select
                                value={countryFilter}
                                onChange={e => setCountryFilter(e.target.value)}
                                className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none cursor-pointer hover:bg-white/5 transition-all w-48"
                            >
                                {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as SortKey)}
                                className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white/80 text-sm focus:outline-none cursor-pointer hover:bg-white/5 transition-all w-52"
                            >
                                <option value="stake_desc">Stake (Highest First)</option>
                                <option value="stake_asc">Stake (Lowest First)</option>
                                <option value="name_asc">Name (A → Z)</option>
                                <option value="country_asc">Country (A → Z)</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                        </div>

                        {hasFilters && (
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-xs font-mono" style={{ color: ACCENT }}>
                                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                                </span>
                                <button
                                    onClick={() => { setSearch(''); setCountryFilter('All'); }}
                                    className="text-xs text-white/40 hover:text-white underline"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Column headers ── */}
                {!loading && !error && validators.length > 0 && (
                    <div className="hidden md:grid grid-cols-11 gap-4 px-6 py-3 bg-white/5 border-y border-white/10 text-xs font-bold text-white/40 uppercase tracking-widest mb-2 sticky top-0 z-10 backdrop-blur-xl">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Validator</div>
                        <div className="col-span-2 text-right">Stake</div>
                        <div className="col-span-3 text-right">Location</div>
                    </div>
                )}

                {/* ── Loading ── */}
                {loading && (
                    <div className="py-20 text-center">
                        <div
                            className="animate-spin h-8 w-8 border-4 rounded-full mx-auto mb-4"
                            style={{ borderColor: `${ACCENT}4D`, borderTopColor: ACCENT }}
                        />
                        <p className="text-white/40">Loading validators…</p>
                    </div>
                )}

                {/* ── Error ── */}
                {error && !loading && (
                    <div className="rounded-2xl border border-red-500/30 p-6 text-center">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* ── Validator rows ── */}
                {!loading && !error && (
                    <div className="space-y-1">
                        {filtered.map((v, idx) => {
                            const flag = getFlagEmoji(v.country);
                            const hasLogo = !!v.logo;

                            return (
                                <div
                                    key={`${v.name}-${idx}`}
                                    className="group relative grid grid-cols-1 gap-4 px-6 py-4 items-center rounded-xl transition-all border md:grid-cols-11"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.05)' }}
                                >
                                    {/* Rank */}
                                    <div className="col-span-1 font-mono text-white/30 text-sm">{idx + 1}</div>

                                    {/* Identity */}
                                    <div className="col-span-5 flex items-center space-x-3 overflow-hidden">
                                        <div
                                            className="p-2 rounded-lg flex-shrink-0 flex items-center justify-center"
                                            style={{ backgroundColor: hasLogo ? 'transparent' : 'rgba(255,255,255,0.05)', minWidth: 36, minHeight: 36 }}
                                        >
                                            {hasLogo ? (
                                                <img
                                                    src={v.logo}
                                                    alt={v.name}
                                                    width={28}
                                                    height={28}
                                                    className="w-7 h-7 rounded-full object-cover"
                                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <ServerIcon className="h-5 w-5 text-white/30" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-sm truncate">{v.name}</p>
                                            <p className="text-xs text-white/30 truncate">{v.city || v.country}</p>
                                        </div>
                                    </div>

                                    {/* Stake */}
                                    <div className="col-span-2 text-right">
                                        <p className="text-white font-mono text-sm" style={{ color: v.stake > 0 ? ACCENT : 'rgba(255,255,255,0.3)' }}>
                                            {formatStake(v.stake)}
                                        </p>
                                        <p className="text-xs text-white/30">MON staked</p>
                                    </div>

                                    {/* Location */}
                                    <div className="col-span-3 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <div className="text-right">
                                                <p className="text-white/70 text-sm">{v.city || '—'}</p>
                                                <p className="text-xs text-white/30">{v.country}</p>
                                            </div>
                                            <span className="text-2xl" title={v.country}>{flag}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filtered.length === 0 && validators.length > 0 && (
                            <div className="py-16 text-center">
                                <p className="text-white/40 text-sm">No validators match your search.</p>
                                <button
                                    onClick={() => { setSearch(''); setCountryFilter('All'); }}
                                    className="mt-3 text-xs underline"
                                    style={{ color: ACCENT }}
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

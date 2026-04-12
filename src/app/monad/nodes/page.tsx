'use client';

import { useEffect, useState, useMemo } from 'react';
import ParticlesBackground from '@/components/ParticlesBackground';
import { MonadDashboardMetrics, MonadValidator } from '@/types/monad';

const ACCENT = '#836EF9';
const BG = '#08070f';

type SortKey = 'stake_desc' | 'stake_asc' | 'name_asc' | 'country_asc' | 'active_first';

function flagEmoji(isoCode: string): string {
    if (!isoCode || isoCode.length !== 2) return '🌐';
    const base = 0x1F1E6 - 65;
    try {
        return String.fromCodePoint(
            isoCode.toUpperCase().charCodeAt(0) + base,
            isoCode.toUpperCase().charCodeAt(1) + base,
        );
    } catch {
        return '🌐';
    }
}

function formatStake(stake: number): string {
    if (stake === 0) return '—';
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
    const [showInactiveOnly, setShowInactiveOnly] = useState(false);

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

    const filtered = useMemo(() => {
        let list = validators;
        if (showInactiveOnly) list = list.filter(v => !v.active);
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
        else if (sortBy === 'active_first') sorted.sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
        return sorted;
    }, [validators, search, sortBy, showInactiveOnly]);

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: BG }}>
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
                    <span style={{ color: ACCENT }} className="mt-0.5 shrink-0 text-base">ℹ</span>
                    <span className="text-white/50 leading-relaxed">
                        IP / hosting-provider data (OVH, AWS…) unavailable — Monad uses a custom MonadBFT peer-discovery protocol with no public RPC endpoint for validator IPs.
                        Country and city data is sourced from{' '}
                        <a href="https://gmonads.com" target="_blank" rel="noopener noreferrer"
                            style={{ color: ACCENT }} className="underline hover:opacity-80">
                            gmonads.com
                        </a>.
                    </span>
                </div>

                {/* ── Controls ── */}
                {!loading && !error && validators.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name, country, city…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as SortKey)}
                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="stake_desc">Stake ↓ (Highest)</option>
                            <option value="stake_asc">Stake ↑ (Lowest)</option>
                            <option value="name_asc">Name A → Z</option>
                            <option value="country_asc">Country A → Z</option>
                            <option value="active_first">Active first</option>
                        </select>

                        {/* Active filter */}
                        <button
                            onClick={() => setShowInactiveOnly(v => !v)}
                            className="px-4 py-2 rounded-xl border text-sm transition-colors"
                            style={showInactiveOnly
                                ? { borderColor: ACCENT, color: ACCENT, background: `${ACCENT}18` }
                                : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                        >
                            {showInactiveOnly ? 'Inactive only ✕' : 'Show inactive only'}
                        </button>

                        {/* Result count */}
                        <span className="text-white/30 text-sm ml-auto">
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* ── Loading skeleton ── */}
                {loading && (
                    <div className="rounded-2xl border border-white/10 overflow-hidden animate-pulse">
                        <div className="bg-white/5 px-6 py-4 h-12" />
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="border-t border-white/5 px-6 py-4 flex gap-6">
                                <div className="h-3 bg-white/10 rounded w-1/4" />
                                <div className="h-3 bg-white/5 rounded w-1/6" />
                                <div className="h-3 bg-white/5 rounded w-1/6" />
                                <div className="h-3 bg-white/5 rounded w-1/8 ml-auto" />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Error ── */}
                {error && !loading && (
                    <div className="rounded-2xl border border-red-500/30 p-6 text-center">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* ── Validator table ── */}
                {!loading && !error && filtered.length > 0 && (
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${ACCENT}33` }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ backgroundColor: `${ACCENT}10` }}>
                                        <th className="px-4 py-3 text-left font-medium text-white/40 uppercase tracking-wider text-xs w-10">#</th>
                                        <th className="px-4 py-3 text-left font-medium text-white/40 uppercase tracking-wider text-xs">Validator</th>
                                        <th className="px-4 py-3 text-left font-medium text-white/40 uppercase tracking-wider text-xs">Country</th>
                                        <th className="px-4 py-3 text-left font-medium text-white/40 uppercase tracking-wider text-xs">City</th>
                                        <th className="px-4 py-3 text-right font-medium text-white/40 uppercase tracking-wider text-xs">Stake (MON)</th>
                                        <th className="px-4 py-3 text-center font-medium text-white/40 uppercase tracking-wider text-xs">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map((v, idx) => (
                                        <tr key={`${v.name}-${idx}`} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-white/20 tabular-nums text-xs">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-white truncate max-w-[220px] block">
                                                    {v.name || <span className="text-white/30 italic">Unknown</span>}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white/70">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-base leading-none">{flagEmoji(v.country)}</span>
                                                    <span className="text-xs font-mono text-white/50">{v.country || '—'}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white/50 text-xs">{v.city || '—'}</td>
                                            <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: v.stake > 0 ? ACCENT : 'rgba(255,255,255,0.3)' }}>
                                                {formatStake(v.stake)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {v.active ? (
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                    >
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && !error && filtered.length === 0 && validators.length > 0 && (
                    <div className="rounded-2xl border border-white/10 p-12 text-center">
                        <p className="text-white/40 text-sm">No validators match your search.</p>
                        <button onClick={() => { setSearch(''); setShowInactiveOnly(false); }}
                            className="mt-3 text-xs underline" style={{ color: ACCENT }}>
                            Clear filters
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

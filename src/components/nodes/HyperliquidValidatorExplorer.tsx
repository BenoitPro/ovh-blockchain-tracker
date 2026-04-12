'use client';

import { useEffect, useState, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { HyperliquidValidator } from '@/types/hyperliquid';

const ACCENT = '#00E5BE';
const OVH_KEYWORDS = ['ovh', 'ovhcloud', 'ovh cloud', 'soyoustart', 'kimsufi'];

const PROVIDER_RULES: { key: string; label: string; keywords: string[] }[] = [
    { key: 'ovh',          label: 'OVHcloud',      keywords: OVH_KEYWORDS },
    { key: 'aws',          label: 'AWS',            keywords: ['aws', 'amazon'] },
    { key: 'google',       label: 'Google Cloud',   keywords: ['google', 'gcp'] },
    { key: 'hetzner',      label: 'Hetzner',        keywords: ['hetzner'] },
    { key: 'digitalocean', label: 'DigitalOcean',   keywords: ['digitalocean', 'digital ocean'] },
    { key: 'vultr',        label: 'Vultr',          keywords: ['vultr'] },
    { key: 'equinix',      label: 'Equinix',        keywords: ['equinix', 'packet'] },
];

function detectProvider(name: string, description: string): { key: string; label: string } {
    const hay = `${name} ${description}`.toLowerCase();
    for (const rule of PROVIDER_RULES) {
        if (rule.keywords.some(kw => hay.includes(kw))) return rule;
    }
    return { key: 'unknown', label: 'Unknown' };
}

function extractWebsite(description: string): string | null {
    const match = description.match(/https?:\/\/[^\s,)]+/);
    return match ? match[0] : null;
}

function truncate(s: string, n: number) {
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

type SortKey = 'stake_desc' | 'stake_asc' | 'commission_asc' | 'uptime_desc';
type ViewMode = 'all' | 'targets' | 'ovh';

interface ValidatorRow extends HyperliquidValidator {
    provider: { key: string; label: string };
    website: string | null;
    stakeHYPE: number;
    stakePct: number;
}

export default function HyperliquidValidatorExplorer() {
    const [raw, setRaw] = useState<HyperliquidValidator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('stake_desc');
    const [viewMode, setViewMode] = useState<ViewMode>('all');

    useEffect(() => {
        fetch('/api/hyperliquid/validators')
            .then(r => r.json())
            .then(d => { if (d.success) setRaw(d.data); else setError(d.error); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const totalStakeRaw = useMemo(() => raw.reduce((s, v) => s + (v.stake ?? 0), 0), [raw]);

    const rows: ValidatorRow[] = useMemo(() => raw.map(v => ({
        ...v,
        provider: detectProvider(v.name, v.description),
        website: extractWebsite(v.description),
        stakeHYPE: Math.round(v.stake / 1e8),
        stakePct: totalStakeRaw > 0 ? (v.stake / totalStakeRaw) * 100 : 0,
    })), [raw, totalStakeRaw]);

    const filtered = useMemo(() => {
        let r = rows;
        if (viewMode === 'targets') r = r.filter(v => v.provider.key !== 'ovh' && v.isActive);
        if (viewMode === 'ovh') r = r.filter(v => v.provider.key === 'ovh');
        if (search) {
            const q = search.toLowerCase();
            r = r.filter(v =>
                v.name.toLowerCase().includes(q) ||
                v.validator.toLowerCase().includes(q) ||
                v.description.toLowerCase().includes(q)
            );
        }
        const s = [...r];
        if (sortBy === 'stake_desc') s.sort((a, b) => b.stake - a.stake);
        if (sortBy === 'stake_asc') s.sort((a, b) => a.stake - b.stake);
        if (sortBy === 'commission_asc') s.sort((a, b) => a.commissionRate - b.commissionRate);
        if (sortBy === 'uptime_desc') s.sort((a, b) => (b.dailyUptime ?? 0) - (a.dailyUptime ?? 0));
        return s;
    }, [rows, viewMode, search, sortBy]);

    const exportCSV = () => {
        const headers = ['Name', 'Address', 'Stake (HYPE)', 'Stake %', 'Commission', 'Status', 'Uptime (Day)', 'Provider', 'Website'];
        const csvRows = [
            headers.join(','),
            ...filtered.map(v => [
                `"${v.name}"`,
                v.validator,
                v.stakeHYPE,
                v.stakePct.toFixed(2),
                (v.commissionRate * 100).toFixed(1) + '%',
                v.isActive ? 'Active' : (v.isJailed ? 'Jailed' : 'Inactive'),
                v.dailyUptime !== undefined ? (v.dailyUptime * 100).toFixed(1) + '%' : 'N/A',
                `"${v.provider.label}"`,
                `"${v.website ?? ''}"`,
            ].join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'hyperliquid_validators.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="text-[#00E5BE] animate-pulse py-20 text-center">Loading validators…</div>;
    if (error) return <div className="text-red-400 py-20 text-center">{error}</div>;

    const targets = rows.filter(v => v.provider.key !== 'ovh' && v.isActive).length;

    return (
        <div>
            {/* Win-back banner */}
            <div className="mb-8 rounded-2xl border p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                style={{ background: 'rgba(0,229,190,0.04)', borderColor: 'rgba(0,229,190,0.2)' }}>
                <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-[#00E5BE] mb-1">Win-Back Opportunity</div>
                    <p className="text-white font-bold text-lg">{targets} active validators on non-OVH infrastructure</p>
                    <p className="text-gray-400 text-sm mt-1">Each validator entity is a potential OVH bare-metal customer. Sort by stake to prioritize the highest-value targets.</p>
                </div>
                <button onClick={exportCSV}
                    className="shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:scale-105"
                    style={{ background: ACCENT }}>
                    Export CSV
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, address…"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5BE]/40"
                    />
                </div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="stake_desc">Stake ↓</option>
                    <option value="stake_asc">Stake ↑</option>
                    <option value="commission_asc">Commission ↑</option>
                    <option value="uptime_desc">Uptime ↓</option>
                </select>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                    {(['all', 'targets', 'ovh'] as ViewMode[]).map(m => (
                        <button key={m} onClick={() => setViewMode(m)}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors"
                            style={{ background: viewMode === m ? ACCENT : 'rgba(255,255,255,0.05)', color: viewMode === m ? '#000' : '#9CA3AF' }}>
                            {m === 'all' ? 'All' : m === 'targets' ? `Targets (${targets})` : 'OVH'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-600 mb-4 italic">
                Provider column is estimated from validator name/description — IPs are not available in the Hyperliquid API.
            </p>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-left">
                            {['Validator', 'Stake (HYPE)', 'Stake %', 'Commission', 'Status', 'Uptime', 'Provider', 'Website'].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(v => {
                            const isOVH = v.provider.key === 'ovh';
                            return (
                                <tr key={v.validator} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-white">{v.name}</div>
                                        <div className="text-xs text-gray-600 font-mono">{v.validator.slice(0, 10)}…</div>
                                    </td>
                                    <td className="px-4 py-3 text-white font-mono">{v.stakeHYPE.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-gray-300">{v.stakePct.toFixed(1)}%</td>
                                    <td className="px-4 py-3 text-gray-300">{(v.commissionRate * 100).toFixed(1)}%</td>
                                    <td className="px-4 py-3">
                                        {v.isActive ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20">Active</span>
                                        ) : v.isJailed ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20">Jailed</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold text-gray-400 bg-gray-400/10 border border-gray-400/20">Inactive</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">
                                        {v.dailyUptime !== undefined ? `${(v.dailyUptime * 100).toFixed(1)}%` : <span className="text-gray-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${isOVH ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/20' : 'text-gray-400 bg-white/5 border border-white/10'}`}>
                                            {v.provider.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {v.website ? (
                                            <a href={v.website} target="_blank" rel="noreferrer"
                                                className="text-xs text-[#00E5BE] hover:underline truncate max-w-[140px] block">
                                                {truncate(v.website.replace(/^https?:\/\//, ''), 22)}
                                            </a>
                                        ) : <span className="text-gray-600 text-xs">—</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="py-16 text-center text-gray-500">No validators match your filters.</div>
                )}
            </div>

            <p className="text-xs text-gray-700 mt-4">{filtered.length} validators shown</p>
        </div>
    );
}

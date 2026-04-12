'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from 'recharts';
import Header from '@/components/dashboard/Header';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import ParticlesBackground from '@/components/ParticlesBackground';
import { HyperliquidDashboardMetrics, HyperliquidAPIResponse } from '@/types/hyperliquid';

const ACCENT = '#00E5BE';

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-2xl border p-6" style={{ background: 'rgba(0,229,190,0.04)', borderColor: 'rgba(0,229,190,0.15)' }}>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">{label}</p>
            <p className="text-3xl font-black text-[#00E5BE]">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
    );
}

export default function HyperliquidAnalytics() {
    const [metrics, setMetrics] = useState<HyperliquidDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/hyperliquid')
            .then(r => r.json())
            .then((d: HyperliquidAPIResponse) => {
                if (d.success && d.data) setMetrics(d.data);
                else setError(d.error ?? 'Unknown error');
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <ParticlesBackground />
                <div className="relative z-10 text-[#00E5BE] animate-pulse text-lg font-bold">Loading…</div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <ParticlesBackground />
                <div className="relative z-10 text-red-400">{error ?? 'No data'}</div>
            </div>
        );
    }

    const allValidators = metrics.allValidators ?? [];
    const active = allValidators.filter(v => v.isActive);
    const jailed = allValidators.filter(v => v.isJailed);

    const avgUptime = (() => {
        const ws = active.filter(v => typeof v.dailyUptime === 'number');
        if (!ws.length) return null;
        return ws.reduce((s, v) => s + (v.dailyUptime ?? 0), 0) / ws.length;
    })();

    const totalStakeHYPE = (metrics.totalStake / 1e8).toLocaleString('en-US', { maximumFractionDigits: 0 });

    // Stake distribution chart — top 15 validators by stake
    const stakeChart = [...active]
        .sort((a, b) => b.stake - a.stake)
        .slice(0, 15)
        .map(v => ({
            name: v.name.length > 16 ? v.name.slice(0, 14) + '…' : v.name,
            stake: Math.round(v.stake / 1e8),
            pct: metrics.totalStake > 0 ? ((v.stake / metrics.totalStake) * 100).toFixed(1) : '0',
        }));

    // Commission distribution chart
    const commissionBuckets: Record<string, number> = { '0%': 0, '1-2%': 0, '3-5%': 0, '6-10%': 0, '>10%': 0 };
    for (const v of active) {
        const r = v.commissionRate * 100;
        if (r === 0) commissionBuckets['0%']++;
        else if (r <= 2) commissionBuckets['1-2%']++;
        else if (r <= 5) commissionBuckets['3-5%']++;
        else if (r <= 10) commissionBuckets['6-10%']++;
        else commissionBuckets['>10%']++;
    }
    const commissionChart = Object.entries(commissionBuckets).map(([label, count]) => ({ label, count }));

    return (
        <div className="relative min-h-screen">
            <ParticlesBackground />
            <main className="relative z-10 p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
                <Header network="Hyperliquid" subtitle="Network Analytics" />

                {/* Disclaimer */}
                <div className="mt-6 mb-8 px-4 py-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 text-xs text-yellow-300/70">
                    Note: The Hyperliquid API does not expose node IP addresses. Provider attribution is based on validator name/description matching only — results are best-effort estimates.
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <KPI label="Total Validators" value={String(metrics.totalValidators)} />
                    <KPI label="Active" value={String(metrics.activeValidators)} />
                    <KPI label="Jailed" value={String(jailed.length)} />
                    <KPI label="HYPE Staked" value={totalStakeHYPE} sub="across active validators" />
                    <KPI label="OVH Detected" value={String(metrics.ovhValidators)} sub="via name matching" />
                    <KPI label="OVH Market Share" value={metrics.ovhValidators > 0 ? `${metrics.marketShare.toFixed(1)}%` : 'N/A'} />
                    {avgUptime !== null && <KPI label="Avg Daily Uptime" value={`${(avgUptime * 100).toFixed(1)}%`} sub="active validators" />}
                </div>

                {/* Stake distribution */}
                <div className="mb-10 rounded-2xl border p-8" style={{ background: 'rgba(0,229,190,0.03)', borderColor: 'rgba(0,229,190,0.15)' }}>
                    <h2 className="text-xl font-bold text-white mb-2">Stake Distribution</h2>
                    <p className="text-xs text-gray-500 mb-6">Top 15 active validators by HYPE staked</p>
                    <div style={{ height: 340 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stakeChart} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false}
                                    tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#D1D5DB', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,229,190,0.05)' }}
                                    contentStyle={{ background: '#050510', border: '1px solid rgba(0,229,190,0.3)', borderRadius: 12 }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(v: any) => [`${Number(v).toLocaleString()} HYPE`, 'Stake']}
                                />
                                <Bar dataKey="stake" radius={[0, 6, 6, 0]} maxBarSize={32}>
                                    <LabelList dataKey="pct" position="right" style={{ fill: '#9CA3AF', fontSize: 10 }}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(v: any) => `${v}%`} />
                                    {stakeChart.map((_, i) => (
                                        <Cell key={i} fill={ACCENT} opacity={1 - i * 0.04} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Commission + Provider breakdown row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                    {/* Commission distribution */}
                    <div className="rounded-2xl border p-8" style={{ background: 'rgba(0,229,190,0.03)', borderColor: 'rgba(0,229,190,0.15)' }}>
                        <h2 className="text-xl font-bold text-white mb-2">Commission Distribution</h2>
                        <p className="text-xs text-gray-500 mb-6">Active validators by commission rate bucket</p>
                        <div style={{ height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={commissionChart} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#050510', border: '1px solid rgba(0,229,190,0.3)', borderRadius: 12 }}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(v: any) => [v, 'Validators']}
                                    />
                                    <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} maxBarSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Provider breakdown */}
                    <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                </div>
            </main>
        </div>
    );
}

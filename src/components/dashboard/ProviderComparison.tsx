'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { ProviderBreakdownEntry } from '@/types';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';

interface ProviderComparisonProps {
    providerBreakdown?: ProviderBreakdownEntry[];
}


interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: ProviderBreakdownEntry }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
    if (!active || !payload || !payload.length) return null;
    const entry = payload[0].payload;

    return (
        <div
            className="rounded-xl p-4 text-sm"
            style={{
                background: 'rgba(0, 14, 30, 0.97)',
                border: `1px solid ${entry.color}60`,
                boxShadow: `0 0 18px ${entry.color}40, 0 0 40px ${entry.color}15`,
                minWidth: 180,
            }}
        >
            <p className="font-bold text-white mb-2">{entry.label}</p>
            <div className="space-y-1 text-gray-300">
                <p>
                    <span className="text-gray-400">Nodes: </span>
                    <span className="font-semibold text-white">{entry.nodeCount}</span>
                </p>
                <p>
                    <span className="text-gray-400">Market share: </span>
                    <span className="font-semibold" style={{ color: entry.color }}>
                        {entry.marketShare.toFixed(2)}%
                    </span>
                </p>
                {entry.subProviders && entry.subProviders.length > 0 && (
                    <div className="pt-3 pb-1 border-t border-white/10 mt-3 space-y-1.5 min-w-[200px]">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Top Others:</p>
                        {entry.subProviders.map((sub, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-gray-300 max-w-[120px] truncate" title={sub.label}>{sub.label}</span>
                                <div className="text-right">
                                    <span className="text-white font-medium mr-1.5">{sub.nodeCount}</span>
                                    <span className="text-gray-500 text-[10px]">({sub.marketShare.toFixed(1)}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ProviderComparison({ providerBreakdown }: ProviderComparisonProps) {
    const { theme } = useNetworkTheme();
    const isEth = theme === 'ethereum';
    const accent = isEth ? '#627EEA' : '#00F0FF';

    if (!providerBreakdown || providerBreakdown.length === 0) {
        return (
            <div className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border p-8 ${isEth ? 'bg-white/70 border-[#627EEA]/15' : 'bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10'}`}>
                <h2 className={`text-xl font-bold mb-6 ${isEth ? 'text-slate-800' : 'text-white'}`}>Provider Comparison</h2>
                <p className={`text-center py-8 ${isEth ? 'text-slate-400' : 'text-gray-400'}`}>No provider data available</p>
            </div>
        );
    }

    // Sort by nodeCount descending, keep top 8
    const chartData = [...providerBreakdown]
        .sort((a, b) => b.nodeCount - a.nodeCount)
        .slice(0, 8);

    return (
        <div className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border p-8 ${isEth ? 'bg-white/70 border-[#627EEA]/15 shadow-sm' : 'bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 glass-card'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className={`text-xl font-bold ${isEth ? 'text-slate-800' : 'text-white'}`}>Provider Comparison</h2>
                    <p className={`text-sm mt-1 ${isEth ? 'text-slate-500' : 'text-gray-400'}`}>Ethereum execution-layer nodes by cloud provider</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
                    <span className="text-xs font-medium" style={{ color: accent }}>Live</span>
                </div>
            </div>

            {/* Bar Chart */}
            <div style={{ height: Math.max(360, chartData.length * 52) }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
                        barCategoryGap="30%"
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isEth ? 'rgba(98,126,234,0.1)' : 'rgba(255,255,255,0.05)'}
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            tick={{ fill: isEth ? '#64748B' : '#6B7280', fontSize: 11 }}
                            axisLine={{ stroke: isEth ? 'rgba(98,126,234,0.15)' : 'rgba(255,255,255,0.08)' }}
                            tickLine={false}
                            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={110}
                            tick={{ fill: isEth ? '#475569' : '#D1D5DB', fontSize: 12, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: isEth ? 'rgba(98,126,234,0.05)' : 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar dataKey="nodeCount" radius={[0, 6, 6, 0]} maxBarSize={36}
                            label={{ position: 'right', fill: isEth ? '#64748B' : '#9CA3AF', fontSize: 11,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter: (v: any) => typeof v === 'number' ? v.toLocaleString() : v }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend / Summary row */}
            <div className="mt-6 flex flex-wrap gap-3">
                {chartData.map((entry) => (
                    <div
                        key={entry.key}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium"
                        style={{
                            background: `${entry.color}${isEth ? '15' : '12'}`,
                            borderColor: `${entry.color}${isEth ? '40' : '30'}`,
                            color: isEth ? entry.color : entry.color,
                        }}
                    >
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: entry.color }}
                        />
                        {entry.label} — {entry.marketShare.toFixed(1)}%
                    </div>
                ))}
            </div>
        </div>
    );
}

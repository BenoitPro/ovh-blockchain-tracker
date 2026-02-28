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

interface ProviderComparisonProps {
    providerBreakdown?: ProviderBreakdownEntry[];
}

const MONTHLY_COST_PER_NODE = 150; // EUR

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
                {entry.key === 'ovh' && (
                    <p className="pt-1 border-t border-white/10 mt-1">
                        <span className="text-gray-400">Est. Rev: </span>
                        <span className="font-semibold text-[#00F0FF]">
                            ~€{(entry.nodeCount * MONTHLY_COST_PER_NODE).toLocaleString('en-US')}/month
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}

export default function ProviderComparison({ providerBreakdown }: ProviderComparisonProps) {
    if (!providerBreakdown || providerBreakdown.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-8">
                <h2 className="text-xl font-bold text-white mb-6">Provider Comparison</h2>
                <p className="text-gray-400 text-center py-8">No provider data available</p>
            </div>
        );
    }

    // Sort by nodeCount descending, keep top 8
    const chartData = [...providerBreakdown]
        .sort((a, b) => b.nodeCount - a.nodeCount)
        .slice(0, 8);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-8 glass-card">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-white">Provider Comparison</h2>
                    <p className="text-sm text-gray-400 mt-1">Solana nodes distribution by provider</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20">
                    <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
                    <span className="text-xs font-medium text-[#00F0FF]">Live</span>
                </div>
            </div>

            {/* Bar Chart */}
            <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
                        barCategoryGap="25%"
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            tick={{ fill: '#6B7280', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={100}
                            tick={{ fill: '#D1D5DB', fontSize: 12, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar dataKey="nodeCount" radius={[0, 6, 6, 0]} maxBarSize={32}>
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
                            background: `${entry.color}12`,
                            borderColor: `${entry.color}30`,
                            color: entry.color,
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

'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendPeriod, TrendResponse, TrendDataPoint } from '@/types';
import PeriodSelector from './PeriodSelector';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

export default function TrendChart() {
    const [period, setPeriod] = useState<TrendPeriod>(30);
    const [data, setData] = useState<TrendDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTrendData(period);
    }, [period]);

    const fetchTrendData = async (selectedPeriod: TrendPeriod) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/trends?period=${selectedPeriod}`);
            const result: TrendResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch trend data');
            }

            // Apply aggregation before setting state
            const aggregated = aggregateData(result.data, selectedPeriod);
            setData(aggregated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // Aggregation logic for smoothing charts
    const aggregateData = (rawData: TrendDataPoint[], selectedPeriod: TrendPeriod): TrendDataPoint[] => {
        // No aggregation for short periods (high fidelity)
        if (selectedPeriod === 30 || selectedPeriod === 90) return rawData;

        // Group by week or month based on period
        const isMonthly = selectedPeriod === 'all' || selectedPeriod === 1825;
        const groups: Record<string, TrendDataPoint[]> = {};

        rawData.forEach(point => {
            const date = new Date(point.timestamp);
            let key: string;

            if (isMonthly) {
                // Monthly aggregation for 'all' and 5 years
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
                // Weekly aggregation for 180j and 365j
                const fw = new Date(date.getFullYear(), 0, 1);
                const week = Math.ceil((((date.getTime() - fw.getTime()) / 86400000) + fw.getDay() + 1) / 7);
                key = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(point);
        });

        // Calculate averages for each group
        return Object.values(groups).map(group => {
            const avgMarketShare = group.reduce((sum, p) => sum + p.marketShare, 0) / group.length;
            const avgOvhNodes = Math.round(group.reduce((sum, p) => sum + p.ovhNodes, 0) / group.length);
            const avgTotalNodes = Math.round(group.reduce((sum, p) => sum + p.totalNodes, 0) / group.length);
            // Use the timestamp of the middle point for accurate X-axis positioning
            const midPoint = group[Math.floor(group.length / 2)];

            return {
                timestamp: midPoint.timestamp,
                date: midPoint.date,
                marketShare: avgMarketShare,
                ovhNodes: avgOvhNodes,
                totalNodes: avgTotalNodes
            };
        }).sort((a, b) => a.timestamp - b.timestamp);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (period === 'all' || period === 1825) {
            return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        }
        if (period === 180 || period === 365) {
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(2)}%`;
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload as TrendDataPoint;
            return (
                <div
                    className="bg-gray-900/95 backdrop-blur-sm border border-cyan-500/40 rounded-lg p-4"
                    style={{ boxShadow: '0 0 18px rgba(0, 240, 255, 0.35), 0 0 40px rgba(0, 240, 255, 0.15)' }}
                >
                    <p className="text-gray-400 text-sm mb-2">
                        {new Date(dataPoint.timestamp).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                    <p className="text-white font-bold text-lg">
                        {formatPercentage(dataPoint.marketShare)}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                        {dataPoint.ovhNodes} / {dataPoint.totalNodes} nodes
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">📈 Évolution du Market Share</h2>
                    <PeriodSelector selectedPeriod={period} onPeriodChange={setPeriod} />
                </div>
                <LoadingState />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">📈 Évolution du Market Share</h2>
                    <PeriodSelector selectedPeriod={period} onPeriodChange={setPeriod} />
                </div>
                <ErrorState message={error} />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">📈 Évolution du Market Share</h2>
                    <PeriodSelector selectedPeriod={period} onPeriodChange={setPeriod} />
                </div>
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p className="text-lg">📊 Pas encore de données historiques</p>
                    <p className="text-sm mt-2">Lancez le worker pour commencer à collecter des données</p>
                    <code className="mt-4 px-4 py-2 bg-gray-800 rounded text-xs">npm run worker</code>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">📈 Évolution du Market Share</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {data.length} point{data.length > 1 ? 's' : ''} de données
                    </p>
                </div>
                <PeriodSelector selectedPeriod={period} onPeriodChange={setPeriod} />
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        tickFormatter={formatPercentage}
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotoneX" // Smoother interpolation than 'monotone'
                        dataKey="marketShare"
                        stroke="url(#lineGradient)"
                        strokeWidth={4} // Thicker, more premium line
                        dot={data.length < 40 ? { fill: '#3b82f6', r: 4, strokeWidth: 0 } : false} // Hide dots for dense data
                        activeDot={{ r: 8, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

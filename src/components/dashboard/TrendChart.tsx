'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendPeriod, TrendResponse, TrendDataPoint } from '@/types';
import PeriodSelector from './PeriodSelector';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

export default function TrendChart() {
    const [period, setPeriod] = useState<TrendPeriod>(90);
    const [displayMode, setDisplayMode] = useState<'marketShare' | 'absolute'>('marketShare');
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
            const aggregated = aggregateData(result.data);
            setData(aggregated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // Aggregation logic: Limit to ~15 data points maximum based on data's own timeframe
    const aggregateData = (rawData: TrendDataPoint[]): TrendDataPoint[] => {
        if (rawData.length <= 15) return rawData;
        
        const targetPoints = 15;
        const start = rawData[0].timestamp;
        const end = rawData[rawData.length - 1].timestamp;
        const step = (end - start) / targetPoints;

        if (step === 0) return rawData;

        const grouped: Record<number, TrendDataPoint[]> = {};
        
        rawData.forEach(point => {
            let bucketIndex = Math.floor((point.timestamp - start) / step);
            if (bucketIndex >= targetPoints) bucketIndex = targetPoints - 1;
            
            if (!grouped[bucketIndex]) grouped[bucketIndex] = [];
            grouped[bucketIndex].push(point);
        });

        return Object.values(grouped).map(group => {
            const avgMarketShare = group.reduce((sum, p) => sum + p.marketShare, 0) / group.length;
            const avgOvhNodes = Math.round(group.reduce((sum, p) => sum + p.ovhNodes, 0) / group.length);
            const avgTotalNodes = Math.round(group.reduce((sum, p) => sum + p.totalNodes, 0) / group.length);
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

    const getXDomain = () => {
        const now = Date.now();
        if (period === 90) return [now - 90 * 86400000, now];
        if (period === 365) return [now - 365 * 86400000, now];
        // 'all' -> 5 years (1825 days) mapping
        return [now - 1825 * 86400000, now];
    };

    const getXTicks = () => {
        const [min, max] = getXDomain();
        const span = max - min;
        // 12 ticks for 1y (1 per month), 6 ticks for 90d and All (years)
        const tickCount = period === 365 ? 12 : 6; 
        const step = span / (tickCount - 1);
        const ticks = [];
        for (let i = 0; i < tickCount; i++) {
            ticks.push(min + i * step);
        }
        return ticks;
    };

    const formatTick = (val: number) => {
        const date = new Date(val);
        if (period === 365) {
            // "tous les mois de l'année" -> Just short month name
            return date.toLocaleDateString('en-US', { month: 'short' });
        }
        if (period === 'all') {
            return date.toLocaleDateString('en-US', { year: 'numeric' }); // e.g. 2026
        }
        // 90d -> day and month
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
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
                        {new Date(dataPoint.timestamp).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                    <p className="text-white font-bold text-lg">
                        {displayMode === 'marketShare'
                            ? formatPercentage(dataPoint.marketShare)
                            : `${dataPoint.ovhNodes} OVH nodes`}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                        {dataPoint.ovhNodes} / {dataPoint.totalNodes} total nodes
                    </p>
                </div>
            );
        }
        return null;
    };

    const chartTitle = displayMode === 'marketShare' ? '📈 Market Share Trend' : '📈 OVH Nodes Trend';

    const renderHeader = () => (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">{chartTitle}</h2>
                {data.length > 0 && !loading && !error && (
                    <p className="text-gray-400 text-sm mt-1">
                        {data.length} data point{data.length > 1 ? 's' : ''}
                    </p>
                )}
            </div>
            <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                <button
                    onClick={() => setDisplayMode('marketShare')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${displayMode === 'marketShare' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Market Share (%)
                </button>
                <button
                    onClick={() => setDisplayMode('absolute')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${displayMode === 'absolute' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Node Count
                </button>
            </div>
            <PeriodSelector selectedPeriod={period} onPeriodChange={setPeriod} />
        </div>
    );

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6 min-h-[400px]">
                {renderHeader()}
                <LoadingState fullPage={false} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                {renderHeader()}
                <ErrorState message={error} />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                {renderHeader()}
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p className="text-lg">📊 No historical data yet</p>
                    <p className="text-sm mt-2">Run the worker to start collecting data</p>
                    <code className="mt-4 px-4 py-2 bg-gray-800 rounded text-xs">npm run worker</code>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300">
            {renderHeader()}

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
                        dataKey="timestamp"
                        type="number"
                        domain={getXDomain()}
                        ticks={getXTicks()}
                        tickFormatter={formatTick}
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        tickFormatter={displayMode === 'marketShare' ? formatPercentage : (val) => val.toString()}
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotoneX"
                        dataKey={displayMode === 'marketShare' ? 'marketShare' : 'ovhNodes'}
                        stroke="url(#lineGradient)"
                        strokeWidth={4} // Thicker, more premium line
                        dot={false} // Clean line with no persistent dots
                        activeDot={{ r: 8, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

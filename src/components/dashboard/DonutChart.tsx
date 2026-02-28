'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DonutChartProps {
    providerDistribution: Record<string, number>;
}

const COLORS: Record<string, string> = {
    'OVHcloud': '#00F0FF',     // Cyan - Brand
    'AWS': '#A855F7',          // Purple
    'Google Cloud': '#4285F4', // Blue
    'Hetzner': '#EC4899',      // Pink
    'DigitalOcean': '#0080FF', // Sky Blue
    'Vultr': '#3182CE',        // Deep Blue
    'Equinix': '#6366F1',      // Indigo
    'Others': '#94A3B8',       // Slate
};

const LABEL_MAP: Record<string, string> = {
    'ovh': 'OVHcloud',
    'aws': 'AWS',
    'google': 'Google Cloud',
    'hetzner': 'Hetzner',
    'digitalocean': 'DigitalOcean',
    'vultr': 'Vultr',
    'equinix': 'Equinix',
    'others': 'Others',
};

export default function DonutChart({ providerDistribution = {} }: DonutChartProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const data = Object.entries(providerDistribution)
        .map(([key, value]) => {
            const name = LABEL_MAP[key] || key;
            return {
                name,
                value,
                color: COLORS[name] || '#94A3B8' // Default slate for unknown
            };
        })
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-6 md:p-8 flex flex-col h-[400px] lg:h-[580px]">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex-shrink-0">
                Provider Distribution
            </h2>

            <div className="relative flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={isMobile ? 50 : 80}
                            outerRadius={isMobile ? 90 : 140}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(0, 14, 30, 0.95)',
                                border: '1px solid rgba(0, 240, 255, 0.4)',
                                borderRadius: '12px',
                                color: '#fff',
                                boxShadow: '0 0 18px rgba(0, 240, 255, 0.35), 0 0 40px rgba(0, 240, 255, 0.15)',
                            }}
                            labelStyle={{
                                color: '#fff',
                            }}
                            itemStyle={{
                                color: '#fff',
                            }}
                            formatter={(value: number | undefined) => {
                                if (value === undefined) return ['', ''];
                                return [
                                    `${value} nodes (${((value / total) * 100).toFixed(1)}%)`,
                                    '',
                                ];
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-gray-300">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center label */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-4xl font-bold text-[#00F0FF]">{total}</p>
                    <p className="text-sm text-gray-400 mt-1">Total Nodes</p>
                </div>
            </div>
        </div>
    );
}

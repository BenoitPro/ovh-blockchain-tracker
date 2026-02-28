'use client';

import { TrendPeriod } from '@/types';

interface PeriodSelectorProps {
    selectedPeriod: TrendPeriod;
    onPeriodChange: (period: TrendPeriod) => void;
}

export default function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
    const periods: { value: TrendPeriod; label: string }[] = [
        { value: 90, label: '90d' },
        { value: 365, label: '1y' },
        { value: 'all', label: 'All' },
    ];

    return (
        <div className="flex gap-2">
            {periods.map((period) => (
                <button
                    key={period.value}
                    onClick={() => onPeriodChange(period.value)}
                    className={`
                        px-4 py-2 rounded-lg font-medium text-sm
                        transition-all duration-300
                        ${selectedPeriod === period.value
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }
                    `}
                >
                    {period.label}
                </button>
            ))}
        </div>
    );
}

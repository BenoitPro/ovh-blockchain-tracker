'use client';

import { useEffect, useState } from 'react';
import { CHAINS, type ChainId } from '@/lib/chains';
import { USE_CASES_CONFIG } from '@/lib/config/use-cases-config';
import type { ProviderBreakdownEntry } from '@/types/dashboard';

interface Props {
    chainId: ChainId;
}

const RANK_LABELS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };

function StatTile({
    label,
    value,
    sub,
    accent,
    highlight,
}: {
    label: string;
    value: string;
    sub?: string;
    accent: string;
    highlight?: boolean;
}) {
    return (
        <div
            className="rounded-xl p-4 border bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all"
            style={{
                borderColor: highlight ? `${accent}40` : 'rgba(255,255,255,0.08)',
                boxShadow: highlight ? `0 2px 20px ${accent}15` : undefined,
            }}
        >
            <p className="text-[8px] uppercase tracking-[0.15em] font-bold" style={{ color: highlight ? `${accent}` : 'rgba(255,255,255,0.3)' }}>
                {label}
            </p>
            <p className="text-2xl font-black" style={{ color: highlight ? accent : 'white' }}>
                {value}
            </p>
            {sub && <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">{sub}</p>}
        </div>
    );
}

export default function UseCasesHero({ chainId }: Props) {
    const [ovhRank, setOvhRank] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const chain = CHAINS[chainId];
    const config = USE_CASES_CONFIG[chainId];

    useEffect(() => {
        if (!config) { setLoading(false); return; }

        fetch(config.apiRoute)
            .then((r) => r.json())
            .then((d) => {
                const breakdown: ProviderBreakdownEntry[] = d?.data?.providerBreakdown ?? [];
                const ranked = breakdown
                    .filter((p) => p.key !== 'others')
                    .sort((a, b) => b.marketShare - a.marketShare);
                const idx = ranked.findIndex((p) => p.key === 'ovh');
                setOvhRank(idx === -1 ? null : idx + 1);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [config]);

    if (!config) return null;

    const { accent } = chain;
    const showRank = !loading && ovhRank !== null && ovhRank <= 3;

    return (
        <div className={`grid gap-3 mb-12 ${showRank ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {/* A — OVH Rank (only if top 3) */}
            {showRank && (
                <StatTile
                    label={`${chain.name} Provider Rank`}
                    value={`#${RANK_LABELS[ovhRank!] ?? ovhRank}`}
                    sub="by node count"
                    accent={accent}
                    highlight
                />
            )}

            {/* D — Chain-specific highlights */}
            {config.techHighlights.map((h) => (
                <StatTile key={h.label} label={h.label} value={h.value} sub={h.sub} accent={accent} />
            ))}

            {/* C — OVH global infra */}
            <div
                className="rounded-xl p-4 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-1 transition-all"
            >
                <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">OVH Infrastructure</p>
                <p className="text-xl font-black text-white">46 DCs</p>
                <p className="text-[8px] text-white/20 uppercase tracking-[0.08em] leading-relaxed">
                    1.3 Tbit/s Anti-DDoS · NVMe Bare Metal
                </p>
            </div>
        </div>
    );
}

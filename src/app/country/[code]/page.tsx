'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ServerIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { CountryDetailResponse, CountryNode } from '@/types';
import Image from 'next/image';
import ParticlesBackground from '@/components/ParticlesBackground';

function formatSOL(lamports: number): string {
    if (!lamports) return '—';
    const sol = lamports / 1e9;
    if (sol >= 1_000_000) return `${(sol / 1_000_000).toFixed(2)}M SOL`;
    if (sol >= 1_000) return `${(sol / 1_000).toFixed(1)}K SOL`;
    return `${sol.toFixed(2)} SOL`;
}

// Country name → flag emoji
function flagEmoji(code: string): string {
    return code
        .toUpperCase()
        .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export default function CountryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const code = (params.code as string).toUpperCase();

    const [data, setData] = useState<CountryDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/country/${code}`)
            .then((r) => r.json())
            .then((json: CountryDetailResponse) => {
                if (!json.success) throw new Error(json.error || 'Failed to load');
                setData(json);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [code]);

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050510]">
            <ParticlesBackground />

            <div className="relative z-10 container mx-auto px-6 py-12">
                {/* Back button */}
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 mb-10 text-gray-400 hover:text-[#00F0FF] transition-colors group"
                >
                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to dashboard</span>
                </button>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-10 h-10 border-2 border-[#00F0FF]/30 border-t-[#00F0FF] rounded-full animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-8 text-center">
                        <p className="text-red-400 font-medium">{error}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back to dashboard
                        </button>
                    </div>
                )}

                {/* Data */}
                {data && !loading && (
                    <>
                        {/* Header */}
                        <div className="mb-10">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-5xl">{flagEmoji(code)}</span>
                                <div>
                                    <h1 className="text-3xl font-bold text-white">{data.countryName}</h1>
                                    <p className="text-gray-400 mt-1">
                                        OVHcloud nodes on the Solana blockchain
                                    </p>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="mt-6 flex flex-wrap gap-4">
                                <div className="px-4 py-3 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20">
                                    <p className="text-xs text-gray-400 mb-1">OVH Nodes</p>
                                    <p className="text-2xl font-bold text-[#00F0FF]">{data.totalNodes}</p>
                                </div>
                                <div className="px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                    <p className="text-xs text-gray-400 mb-1">Total Stake</p>
                                    <p className="text-2xl font-bold text-violet-300">{formatSOL(data.totalStake)}</p>
                                </div>
                                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-xs text-gray-400 mb-1">Validators</p>
                                    <p className="text-2xl font-bold text-white">
                                        {data.nodes.filter((n) => n.isValidator).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Nodes table */}
                        {data.nodes.length === 0 ? (
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
                                <p className="text-gray-400">No OVH nodes found for this country.</p>
                            </div>
                        ) : (
                            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10">
                                {/* Table header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-3">Identity</div>
                                    <div className="col-span-2">IP</div>
                                    <div className="col-span-2">City</div>
                                    <div className="col-span-2">Stake</div>
                                    <div className="col-span-1 text-center">Val.</div>
                                    <div className="col-span-1 text-right">Comm.</div>
                                </div>

                                {/* Table rows */}
                                <div className="divide-y divide-white/[0.04]">
                                    {data.nodes.map((node: CountryNode, idx) => (
                                        <div
                                            key={node.pubkey}
                                            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors"
                                        >
                                            {/* # */}
                                            <div className="col-span-1 flex items-center">
                                                <span className="text-sm text-gray-500">{idx + 1}</span>
                                            </div>

                                            {/* Identity */}
                                            <div className="col-span-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {node.image ? (
                                                        <Image src={node.image} alt={node.name || ''} width={32} height={32} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ServerIcon className="w-4 h-4 text-white/30" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {node.name || 'Unknown Validator'}
                                                    </p>
                                                    <code className="text-xs text-gray-500 font-mono truncate block">
                                                        {node.pubkey.slice(0, 6)}…{node.pubkey.slice(-6)}
                                                    </code>
                                                </div>
                                            </div>

                                            {/* IP */}
                                            <div className="col-span-2 flex items-center">
                                                <code className="text-xs text-gray-400 font-mono">{node.ip}</code>
                                            </div>

                                            {/* City */}
                                            <div className="col-span-2 flex items-center gap-1.5">
                                                <MapPinIcon className="w-3.5 h-3.5 text-[#00F0FF] flex-shrink-0" />
                                                <span className="text-sm text-gray-300 truncate">{node.city}</span>
                                            </div>

                                            {/* Stake */}
                                            <div className="col-span-2 flex items-center">
                                                <span className="text-sm font-semibold text-violet-300">
                                                    {formatSOL(node.activatedStake)}
                                                </span>
                                            </div>

                                            {/* Validator */}
                                            <div className="col-span-1 flex items-center justify-center">
                                                {node.isValidator ? (
                                                    <ShieldCheckIcon className="w-5 h-5 text-[#00F0FF]" />
                                                ) : (
                                                    <span className="text-gray-600 text-sm">—</span>
                                                )}
                                            </div>

                                            {/* Commission */}
                                            <div className="col-span-1 flex items-center justify-end">
                                                <span className="text-sm text-gray-400">
                                                    {node.commission != null && node.commission > 0
                                                        ? `${node.commission}%`
                                                        : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import ParticlesBackground from '@/components/ParticlesBackground';
import { MonadDashboardMetrics, MonadCountryEntry } from '@/types/monad';

const ACCENT = '#836EF9';
const BG = '#08070f';

export default function MonadNodesPage() {
    const [metrics, setMetrics] = useState<MonadDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/monad')
            .then((res) => res.json())
            .then((json) => {
                if (json.success && json.data) {
                    setMetrics(json.data);
                } else {
                    setError(json.error ?? 'Failed to load data');
                }
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, []);

    const validatorCount = metrics?.totalValidators ?? 0;

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{ backgroundColor: BG }}
        >
            <ParticlesBackground />

            <main className="relative z-10 container mx-auto px-6 py-12">
                {/* ── Header ── */}
                <div className="mb-10">
                    <h2
                        className="text-3xl font-bold"
                        style={{
                            background: `linear-gradient(to right, ${ACCENT}, #a78bfa)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Monad Node Explorer
                    </h2>
                    <p className="text-white/50 mt-2">
                        {loading
                            ? 'Loading validator data…'
                            : validatorCount > 0
                              ? `Tracking ${validatorCount.toLocaleString()} validators on the Monad testnet.`
                              : 'Validator data unavailable — the background worker may not have run yet.'}
                    </p>
                </div>

                {/* ── Coming Soon Block ── */}
                <div
                    className="rounded-2xl border p-8 mb-10 text-center"
                    style={{
                        borderColor: `${ACCENT}44`,
                        background: `linear-gradient(135deg, ${ACCENT}14 0%, #08070f 100%)`,
                    }}
                >
                    <div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 mx-auto"
                        style={{ backgroundColor: `${ACCENT}22`, border: `2px solid ${ACCENT}55` }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={ACCENT}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-8 h-8"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4l3 3" />
                        </svg>
                    </div>

                    <h3
                        className="text-2xl font-semibold mb-3"
                        style={{ color: ACCENT }}
                    >
                        Infrastructure Detection Coming Soon
                    </h3>

                    <p className="text-white/70 max-w-2xl mx-auto mb-4 leading-relaxed">
                        Monad uses <strong className="text-white">MonadBFT</strong>, a custom
                        high-performance BFT consensus engine with its own peer-discovery layer.
                        Validators advertise themselves via <em>signed name records</em> rather
                        than standard libp2p DHT entries or public RPC endpoints, which means
                        there is currently no way to enumerate peer IPs from a public RPC call.
                    </p>

                    <p className="text-white/50 max-w-2xl mx-auto text-sm leading-relaxed">
                        Detecting OVH-hosted nodes requires a dedicated MonadBFT p2p crawler that
                        connects to the network, collects advertised peer addresses, and resolves
                        them against the MaxMind GeoLite2 ASN database. This crawler is on the
                        roadmap. Until it ships, the IP / hosting-provider breakdown is
                        unavailable. Country data below is sourced directly from the{' '}
                        <a
                            href="https://gmonads.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: ACCENT }}
                            className="underline hover:opacity-80 transition-opacity"
                        >
                            gmonads.com
                        </a>{' '}
                        community validator dashboard.
                    </p>
                </div>

                {/* ── Country Breakdown Table ── */}
                {metrics && metrics.countryBreakdown && metrics.countryBreakdown.length > 0 && (
                    <div
                        className="rounded-2xl border overflow-hidden"
                        style={{ borderColor: `${ACCENT}33` }}
                    >
                        <div
                            className="px-6 py-4 border-b"
                            style={{ borderColor: `${ACCENT}22`, backgroundColor: `${ACCENT}0d` }}
                        >
                            <h4 className="text-lg font-semibold text-white">
                                Validator Distribution by Country
                            </h4>
                            <p className="text-white/40 text-sm mt-0.5">
                                Based on location data reported by gmonads.com
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr
                                        className="text-left"
                                        style={{ backgroundColor: `${ACCENT}08` }}
                                    >
                                        <th className="px-6 py-3 font-medium text-white/50 uppercase tracking-wider text-xs">
                                            Country
                                        </th>
                                        <th className="px-6 py-3 font-medium text-white/50 uppercase tracking-wider text-xs text-right">
                                            Validators
                                        </th>
                                        <th className="px-6 py-3 font-medium text-white/50 uppercase tracking-wider text-xs text-right">
                                            Share
                                        </th>
                                        <th className="px-6 py-3 font-medium text-white/50 uppercase tracking-wider text-xs text-right">
                                            Total Stake (MON)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {metrics.countryBreakdown.map((entry: MonadCountryEntry, idx: number) => (
                                        <tr
                                            key={entry.country}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-3 text-white font-medium">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{
                                                            backgroundColor:
                                                                idx === 0
                                                                    ? ACCENT
                                                                    : `${ACCENT}${Math.max(20, 80 - idx * 8).toString(16).padStart(2, '0')}`,
                                                        }}
                                                    />
                                                    {entry.country}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-white/80 text-right tabular-nums">
                                                {entry.count.toLocaleString()}
                                            </td>
                                            <td
                                                className="px-6 py-3 text-right tabular-nums font-medium"
                                                style={{ color: ACCENT }}
                                            >
                                                {entry.percentage.toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-3 text-white/60 text-right tabular-nums">
                                                {entry.totalStake > 0
                                                    ? entry.totalStake.toLocaleString(undefined, {
                                                          maximumFractionDigits: 0,
                                                      })
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Loading skeleton for table */}
                {loading && (
                    <div
                        className="rounded-2xl border p-8 animate-pulse"
                        style={{ borderColor: `${ACCENT}22` }}
                    >
                        <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-3 bg-white/5 rounded mb-3 w-full" />
                        ))}
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div
                        className="rounded-2xl border p-6 text-center"
                        style={{ borderColor: '#ff444444' }}
                    >
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}
            </main>
        </div>
    );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ChainToggle from '@/components/ChainToggle';

export default function Sidebar() {
    const pathname = usePathname();
    const isEth = pathname.startsWith('/ethereum');
    const isNodes = pathname.startsWith('/nodes');
    const isDashboard = !isNodes;

    const accent = isEth ? '#627EEA' : '#00F0FF';

    /* ── Theming helpers ──────────────────────────────────────────────── */
    const sidebarBg = isEth
        ? 'bg-white/80 backdrop-blur-xl border-r border-[#627EEA]/12'
        : 'bg-black/60 backdrop-blur-xl border-r border-white/10';

    const divider = isEth ? 'bg-[#627EEA]/12' : 'bg-white/10';

    const navActiveStyle = isEth
        ? { background: 'rgba(98,126,234,0.10)', color: '#627EEA' }
        : { background: 'rgba(0,240,255,0.08)', color: '#00F0FF' };

    const navInactiveClass = isEth
        ? 'text-slate-400 hover:bg-[#627EEA]/5'
        : 'text-white/40 hover:bg-white/5';

    const navInactiveHoverStyle = isEth
        ? { '--hover-color': '#627EEA' } as React.CSSProperties
        : { '--hover-color': '#00F0FF' } as React.CSSProperties;

    const sectionLabelClass = isEth
        ? 'text-slate-300 text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-1'
        : 'text-white/25 text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-1';

    const methodologyTextClass = isEth ? 'text-slate-400' : 'text-white/40';
    const methodologyBodyClass = isEth ? 'text-slate-500' : 'text-white/50';
    const methodologyBorder = isEth
        ? 'border border-[#627EEA]/12 bg-white/70 backdrop-blur-md'
        : 'border border-white/8 bg-black/50 backdrop-blur-md';

    return (
        <aside className={`fixed left-0 top-0 h-screen w-60 z-30 flex flex-col overflow-y-auto ${sidebarBg}`}
            style={isEth ? { boxShadow: '1px 0 24px rgba(98,126,234,0.06)' } : { boxShadow: '1px 0 30px rgba(0,0,0,0.4)' }}
        >

            {/* ── 1. OVH Logo ─────────────────────────────────────────────── */}
            <div className="px-5 pt-8 pb-4 flex justify-center w-full">
                <a
                    href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                >
                    <div className="relative transition-transform duration-500 group-hover:scale-105">
                        <Image
                            src="/ovhcloud-logo.png"
                            alt="OVHcloud"
                            width={200}
                            height={50}
                            className="h-10 w-auto"
                            style={isEth
                                ? { filter: 'brightness(0) saturate(100%) invert(14%) sepia(30%) saturate(500%) hue-rotate(190deg) brightness(90%)' }
                                : { filter: 'brightness(1.15) drop-shadow(0 0 12px rgba(255,255,255,0.25))' }
                            }
                            priority
                        />
                    </div>
                </a>
            </div>

            {/* ── 2. Chain Toggle ──────────────────────────────────────────── */}
            <div className="px-4 pb-4">
                <ChainToggle />
            </div>

            {/* ── Divider ─────────────────────────────────────────────────── */}
            <div className={`h-px mx-4 mb-4 ${divider}`} />

            {/* ── 3. Navigation ───────────────────────────────────────────── */}
            <nav className="flex-1 px-2 space-y-0.5">
                <p className={sectionLabelClass}>Navigation</p>

                {/* Dashboard */}
                <Link
                    href={isEth ? '/ethereum' : '/'}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
                        isDashboard ? '' : navInactiveClass
                    }`}
                    style={isDashboard ? navActiveStyle : undefined}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Dashboard
                </Link>

                {/* Explorer */}
                <Link
                    href="/nodes"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
                        isNodes ? '' : navInactiveClass
                    }`}
                    style={isNodes ? navActiveStyle : undefined}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="8" />
                        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                    </svg>
                    Explorer
                </Link>

                {/* Use Cases — coming soon */}
                <button
                    disabled
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest w-full cursor-not-allowed opacity-40 ${
                        isEth ? 'text-slate-400' : 'text-white/40'
                    }`}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Use Cases
                    <span
                        className="ml-auto text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
                    >
                        Soon
                    </span>
                </button>
            </nav>

            {/* ── 4. Methodology ──────────────────────────────────────────── */}
            <div className="px-3 py-4">
                <div className={`h-px mb-4 ${divider}`} />
                <details className="group">
                    <summary
                        className={`text-[10px] cursor-pointer list-none flex items-center gap-2 font-semibold uppercase tracking-widest outline-none transition-colors duration-200 ${methodologyTextClass}`}
                        style={{ '--hover-color': accent } as React.CSSProperties}
                    >
                        <svg className="w-3 h-3 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Methodology
                        <svg
                            className="w-3 h-3 ml-auto transition-transform duration-300 group-open:rotate-180 opacity-60"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>

                    <div className={`mt-3 p-3 rounded-lg text-[10px] leading-relaxed space-y-2 ${methodologyBodyClass} ${methodologyBorder}`}>
                        {isEth ? (
                            <>
                                <p>
                                    Ethereum execution-layer nodes are discovered via the <strong className={isEth ? 'text-slate-700' : 'text-white/80'}>devp2p/discv4</strong> protocol using the official EF crawler.
                                </p>
                                <ol className="list-decimal list-inside space-y-1 ml-1">
                                    <li><strong className={isEth ? 'text-slate-600' : 'text-white/70'}>Crawl:</strong> 30-60 min P2P crawl, ~5,000–8,000 nodes.</li>
                                    <li><strong className={isEth ? 'text-slate-600' : 'text-white/70'}>ASN Resolution:</strong> IP → ASN via MaxMind GeoLite2.</li>
                                    <li><strong className={isEth ? 'text-slate-600' : 'text-white/70'}>Provider Matching:</strong> ASN against cloud provider lists.</li>
                                </ol>
                                <p className={`pt-2 italic border-t ${isEth ? 'border-slate-200' : 'border-white/10'}`}>
                                    Snapshot-based. Updated manually.
                                </p>
                            </>
                        ) : (
                            <>
                                <p>
                                    Aligned with the{' '}
                                    <a href="https://messari.io/report/evaluating-validator-decentralization-geographic-and-infrastructure-distribution-in-proof-of-stake-networks"
                                        target="_blank" rel="noopener noreferrer"
                                        className="underline" style={{ color: accent }}>
                                        Messari Validator Report
                                    </a>{' '}framework.
                                </p>
                                <ol className="list-decimal list-inside space-y-1 ml-1">
                                    <li><strong className="text-white/70">Solana RPC:</strong> Full census of active validators &amp; RPC nodes.</li>
                                    <li><strong className="text-white/70">ASN Resolution:</strong> IP → ASN via MaxMind GeoLite2.</li>
                                    <li><strong className="text-white/70">Weighting:</strong> Stake/consensus influence where applicable.</li>
                                </ol>
                                <p className="pt-2 italic border-t border-white/10">
                                    Full network (~5,000 nodes). Live data.
                                </p>
                            </>
                        )}
                    </div>
                </details>
            </div>

            {/* ── Animated accent line on right edge ──────────────────────── */}
            <div
                className="absolute right-0 top-0 bottom-0 w-[2px]"
                style={{ background: `linear-gradient(to bottom, transparent, ${accent}50, transparent)` }}
            />
        </aside>
    );
}

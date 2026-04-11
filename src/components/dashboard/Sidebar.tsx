'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import ChainToggle from '@/components/ChainToggle';
import OthersDropdown from '@/components/OthersDropdown';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import { CHAINS } from '@/lib/chains';

export default function Sidebar() {
    const pathname = usePathname();
    const { theme } = useNetworkTheme();
    const currentChain = CHAINS[theme] || CHAINS.solana;
    const accent = currentChain.accent;

    const isNodes = pathname.includes('/nodes');
    const isUseCases = pathname.includes('/use-cases');
    const isAnalytics = pathname.includes('/analytics');
    const isGuide = pathname.includes('/guide');
    const isAbout = pathname.startsWith('/about');
    const isRoadmap = pathname.startsWith('/roadmap');
    const isRevenue = pathname.startsWith('/revenue');
    const isMethodology = pathname.startsWith('/methodology');
    const isDashboard = currentChain.id === 'solana' ? pathname === '/' : pathname === currentChain.route;

    const [mobileOpen, setMobileOpen] = useState(false);

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
      setIsLoggedIn(document.cookie.includes('ovh_ui=1'));
    }, [pathname]);

    async function handleLogout() {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setMobileOpen(false);
    }

    /* ── Theming helpers ──────────────────────────────────────────────── */
    const sidebarBg = 'bg-[#050510]/80 backdrop-blur-xl border-r border-white/5'; // Using simple base classes, colors handled by CSS vars if needed, but here simple transparency is enough
    const divider = 'bg-white/10';

    const navActiveStyle = {
      background: `color-mix(in srgb, var(--chain-accent) 10%, transparent)`,
      color: 'var(--chain-accent)'
    };

    const navInactiveClass = 'text-white/40 hover:bg-white/5 hover:text-white/70';
    const sectionLabelClass = 'text-white/25 text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-1';

    const navLinkBase = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-200`;

    return (
        <>
            {/* ── Mobile hamburger button ─────────────────────────────────── */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl transition-all duration-200"
                style={{
                    background: 'rgba(0,0,0,0.7)',
                    border: `1px solid color-mix(in srgb, var(--chain-accent) 40%, transparent)`,
                    backdropFilter: 'blur(12px)',
                }}
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* ── Mobile overlay ─────────────────────────────────────────── */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Sidebar ────────────────────────────────────────────────── */}
            <aside
                className={`fixed left-0 top-0 h-screen w-60 z-40 flex flex-col overflow-y-auto transition-transform duration-300
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                    ${sidebarBg}`}
                style={{ boxShadow: '1px 0 30px rgba(0,0,0,0.4)' }}
            >

                {/* ── Close button (mobile only) ───────────────────────────── */}
                <button
                    className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg transition-opacity hover:opacity-70"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation"
                    style={{ color: accent }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

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
                                style={{ filter: 'brightness(1.15) drop-shadow(0 0 12px rgba(255,255,255,0.25))' }}
                                priority
                            />
                        </div>
                    </a>
                </div>

                {/* ── 2. Chain Toggle ──────────────────────────────────────────── */}
                <div className="px-4 pb-1.5">
                    <ChainToggle />
                </div>

                {/* ── 3. Others Dropdown ───────────────────────────────────────── */}
                <div className="px-4 pb-4">
                    <OthersDropdown />
                </div>

                {/* ── Divider ─────────────────────────────────────────────────── */}
                <div className={`h-px mx-4 mb-4 ${divider}`} />

                {/* ── 3. Navigation ───────────────────────────────────────────── */}
                <nav className="flex-1 px-2 space-y-0.5" onClick={() => setMobileOpen(false)}>
                    <p className={sectionLabelClass}>Navigation</p>

                    {/* Dashboard */}
                    <Link
                        href={currentChain.id === 'solana' ? '/' : currentChain.route}
                        className={`${navLinkBase} ${isDashboard ? '' : navInactiveClass}`}
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

                    {/* Explorer — private */}
                    {isLoggedIn && (
                        <Link
                            href={`${currentChain.route === '/' ? '' : currentChain.route}/nodes`}
                            className={`${navLinkBase} ${isNodes ? '' : navInactiveClass}`}
                            style={isNodes ? navActiveStyle : undefined}
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="11" cy="11" r="8" />
                                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                            </svg>
                            Explorer
                            <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
                                style={{ color: accent, borderColor: `${accent}50`, background: `${accent}12` }}>
                                Interne
                            </span>
                        </Link>
                    )}


                    {/* Analytics */}
                    <Link
                        href={`${currentChain.route === '/' ? '' : currentChain.route}/analytics`}
                        className={`${navLinkBase} ${isAnalytics ? '' : navInactiveClass}`}
                        style={isAnalytics ? navActiveStyle : undefined}
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        Analytics
                    </Link>

                    {/* Use Cases */}
                    <Link
                        href={`${currentChain.route === '/' ? '' : currentChain.route}/use-cases`}
                        className={`${navLinkBase} ${isUseCases ? '' : navInactiveClass}`}
                        style={isUseCases ? navActiveStyle : undefined}
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Use Cases
                    </Link>

                    {/* Guide */}
                    <Link
                        href={`${currentChain.route === '/' ? '' : currentChain.route}/guide`}
                        className={`${navLinkBase} ${isGuide ? '' : navInactiveClass}`}
                        style={isGuide ? navActiveStyle : undefined}
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Guide
                    </Link>

                    {/* Decentralization (Hyperliquid) */}
                    {theme === 'hyperliquid' && (
                        <Link
                            href="/hyperliquid/decentralize"
                            className={`${navLinkBase} ${pathname.startsWith('/hyperliquid/decentralize') ? '' : navInactiveClass}`}
                            style={pathname.startsWith('/hyperliquid/decentralize') ? navActiveStyle : undefined}
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Decentralization
                        </Link>
                    )}
                </nav>

                {/* ── 4. CTA & Resources ────────────────────────────────────────── */}
                <div className="px-3 pb-6 mt-auto space-y-3">
                    {/* Lead & Roadmap — private links at the bottom */}
                    {isLoggedIn && (
                        <div className="space-y-0.5 rounded-xl border border-white/10 p-1">
                            <Link
                                href="/lead"
                                className={`${navLinkBase} w-full ${pathname.startsWith('/lead') ? '' : navInactiveClass}`}
                                style={pathname.startsWith('/lead') ? navActiveStyle : undefined}
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Lead
                                <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-[var(--chain-accent)]/50 bg-[var(--chain-accent)]/10 text-[var(--chain-accent)]">
                                    Interne
                                </span>
                            </Link>
                            <Link
                                href="/revenue"
                                className={`${navLinkBase} w-full ${isRevenue ? '' : navInactiveClass}`}
                                style={isRevenue ? navActiveStyle : undefined}
                                onClick={() => setMobileOpen(false)}
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Revenue
                                <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-[var(--chain-accent)]/50 bg-[var(--chain-accent)]/10 text-[var(--chain-accent)]">
                                    Interne
                                </span>
                            </Link>
                            <Link
                                href="/roadmap"
                                className={`${navLinkBase} w-full ${isRoadmap ? '' : navInactiveClass}`}
                                style={isRoadmap ? navActiveStyle : undefined}
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Benchmark
                                <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-[var(--chain-accent)]/50 bg-[var(--chain-accent)]/10 text-[var(--chain-accent)]">
                                    Interne
                                </span>
                            </Link>
                            <Link
                                href="/methodology"
                                className={`${navLinkBase} w-full ${isMethodology ? '' : navInactiveClass}`}
                                style={isMethodology ? navActiveStyle : undefined}
                                onClick={() => setMobileOpen(false)}
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Methodology
                                <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-[var(--chain-accent)]/50 bg-[var(--chain-accent)]/10 text-[var(--chain-accent)]">
                                    Interne
                                </span>
                            </Link>
                        </div>
                    )}

                    {/* Admin / Logout — discreet internal link */}
                    {isLoggedIn ? (
                      <button
                        onClick={handleLogout}
                        className={`w-full text-center text-[9px] uppercase tracking-[0.15em] transition-colors duration-200 py-1 text-white/20 hover:text-[var(--chain-accent)]`}
                      >
                        Log out
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className={`block w-full text-center text-[9px] uppercase tracking-[0.15em] transition-colors duration-200 py-1 text-white/20 hover:text-[var(--chain-accent)]`}
                      >
                        Admin
                      </Link>
                    )}
                    <div className={`h-px mb-2 ${divider}`} />

                    {/* Contact CTA */}
                    <Link
                        href="/about"
                        className="w-full group relative flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 overflow-hidden text-white shadow-[0_0_20px_color-mix(in_srgb,var(--chain-accent)_35%,transparent)]"
                        onClick={() => setMobileOpen(false)}
                    >
                        <div
                            className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity duration-300 bg-[linear-gradient(135deg,var(--chain-accent),color-mix(in_srgb,var(--chain-accent)_50%,#fff))] "
                        />
                        <svg className="w-4 h-4 shrink-0 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="relative z-10 font-bold">Contact Us</span>
                    </Link>

                    {/* Official Website Link */}
                    <a
                        href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 text-[9px] uppercase tracking-[0.15em] font-black border border-white/12 bg-white/5 text-white/50 hover:text-white hover:border-white/25 hover:bg-white/10`}
                    >
                        <svg className="w-3.5 h-3.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Go to Official Website
                    </a>
                </div>

                {/* ── Animated accent line on right edge ──────────────────────── */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-[2px]"
                    style={{ background: `linear-gradient(to bottom, transparent, ${accent}50, transparent)` }}
                />
            </aside>
        </>
    );
}

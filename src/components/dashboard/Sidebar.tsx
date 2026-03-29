'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ChainToggle from '@/components/ChainToggle';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';

export default function Sidebar() {
    const pathname = usePathname();
    const { theme } = useNetworkTheme();
    const isEth = theme === 'ethereum';
    const isNodes = pathname.startsWith('/nodes') || pathname.startsWith('/ethereum/nodes');
    const isUseCases = pathname.startsWith('/use-cases') || pathname.startsWith('/ethereum/use-cases');
    const isAnalytics = pathname.startsWith('/analytics') || pathname.startsWith('/ethereum/analytics');
    const isDashboard = !isNodes && !isUseCases && !isAnalytics;

    const [mobileOpen, setMobileOpen] = useState(false);

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
      if (typeof document === 'undefined') return false;
      return document.cookie.includes('ovh_ui=1');
    });

    async function handleLogout() {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setMobileOpen(false);
    }

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

    const sectionLabelClass = isEth
        ? 'text-slate-300 text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-1'
        : 'text-white/25 text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-1';

    const navLinkBase = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-200`;

    return (
        <>
            {/* ── Mobile hamburger button ─────────────────────────────────── */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl transition-all duration-200"
                style={{
                    background: isEth ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
                    border: `1px solid ${accent}40`,
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
                style={isEth ? { boxShadow: '1px 0 24px rgba(98,126,234,0.06)' } : { boxShadow: '1px 0 30px rgba(0,0,0,0.4)' }}
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
                <nav className="flex-1 px-2 space-y-0.5" onClick={() => setMobileOpen(false)}>
                    <p className={sectionLabelClass}>Navigation</p>

                    {/* Dashboard */}
                    <Link
                        href={isEth ? '/ethereum' : '/'}
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

                    {/* Explorer */}
                    {isEth ? (
                        <Link
                            href="/ethereum/nodes"
                            className={`${navLinkBase} opacity-50 hover:opacity-70 ${navInactiveClass}`}
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="11" cy="11" r="8" />
                                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                            </svg>
                            Explorer
                            <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
                                style={{ color: '#627EEA', borderColor: '#627EEA50', background: '#627EEA12' }}>
                                Soon
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/nodes"
                            className={`${navLinkBase} ${isNodes ? '' : navInactiveClass}`}
                            style={isNodes ? navActiveStyle : undefined}
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="11" cy="11" r="8" />
                                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                            </svg>
                            Explorer
                        </Link>
                    )}

                    {/* Analytics */}
                    <Link
                        href={isEth ? '/ethereum/analytics' : '/analytics'}
                        className={`${navLinkBase} ${isAnalytics ? '' : navInactiveClass}`}
                        style={isAnalytics ? navActiveStyle : undefined}
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        Analytics
                    </Link>

                    {/* About Us */}
                    <Link
                        href="/about"
                        className={`${navLinkBase} ${pathname.startsWith('/about') ? '' : navInactiveClass}`}
                        style={pathname.startsWith('/about') ? navActiveStyle : undefined}
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Team & Contact
                    </Link>

                    {/* Use Cases */}
                    <Link
                        href={isEth ? '/ethereum/use-cases' : '/use-cases'}
                        className={`${navLinkBase} ${isUseCases ? '' : navInactiveClass}`}
                        style={isUseCases ? navActiveStyle : undefined}
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Use Cases
                    </Link>
                </nav>

                {/* ── 4. CTA & Resources ────────────────────────────────────────── */}
                <div className="px-3 pb-6 mt-auto space-y-3">
                    {/* Admin / Logout — discreet internal link */}
                    {isLoggedIn ? (
                      <button
                        onClick={handleLogout}
                        className={`w-full text-center text-[9px] uppercase tracking-[0.15em] transition-colors duration-200 py-1 ${
                          isEth ? 'text-slate-400/40 hover:text-slate-400/70' : 'text-white/20 hover:text-white/50'
                        }`}
                      >
                        Déconnexion
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className={`block w-full text-center text-[9px] uppercase tracking-[0.15em] transition-colors duration-200 py-1 ${
                          isEth ? 'text-slate-400/40 hover:text-slate-400/70' : 'text-white/20 hover:text-white/50'
                        }`}
                      >
                        Admin
                      </Link>
                    )}
                    <div className={`h-px mb-2 ${divider}`} />

                    {/* Contact CTA */}
                    <Link
                        href="/about#contact-section"
                        className="w-full group relative flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 overflow-hidden text-white"
                        style={{ boxShadow: isEth ? '0 0 20px rgba(98,126,234,0.35)' : '0 0 20px rgba(0,240,255,0.3)' }}
                        onClick={() => setMobileOpen(false)}
                    >
                        <div
                            className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: isEth ? 'linear-gradient(135deg, #627EEA, #4F6DD4)' : 'linear-gradient(135deg, #22D3EE, #3B82F6)' }}
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
                        className={`group w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 text-[9px] uppercase tracking-[0.15em] font-black ${
                            isEth
                                ? 'border border-[#627EEA]/25 bg-[#627EEA]/8 text-[#627EEA]/60 hover:text-[#627EEA] hover:bg-[#627EEA]/15 hover:border-[#627EEA]/40'
                                : 'border border-white/12 bg-white/5 text-white/50 hover:text-white hover:border-white/25 hover:bg-white/10'
                        }`}
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

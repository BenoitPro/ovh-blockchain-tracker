'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ParticlesBackground from '@/components/ParticlesBackground';
const ACCENT = '#00F0FF';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay },
});

function SectionTitle({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00F0FF] opacity-70">§{number}</span>
                <div className="h-px flex-1 bg-white/10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">{title}</h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-2xl">{subtitle}</p>
        </div>
    );
}

/* ─── §1 — Monitored Networks ──────────────────────────────────────────── */
const CHAINS_DATA = [
    { emoji: '🟣', name: 'Solana', nodes: '~4,000 nodes', freq: 'Every hour', color: '#9945FF' },
    { emoji: '🔷', name: 'Ethereum', nodes: '~6,000 nodes', freq: 'Manual', color: '#627EEA' },
    { emoji: '🔴', name: 'Avalanche', nodes: '~1,200 nodes', freq: 'Every 2h', color: '#E84142' },
    { emoji: '🔵', name: 'Sui', nodes: '~110 validators', freq: 'Every 2h', color: '#4DA2FF' },
    { emoji: '⚡', name: 'Tron', nodes: '~300 nodes', freq: 'Every 2h', color: '#FF0013' },
    { emoji: '⚪', name: 'Hyperliquid', nodes: '~30 validators', freq: 'Every 6h', color: '#a0a0a0' },
];

function NetworksChart() {
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                {CHAINS_DATA.map((c) => (
                    <div
                        key={c.name}
                        className="glass-card p-4 flex flex-col gap-1.5 relative overflow-hidden"
                        style={{ borderColor: `${c.color}30` }}
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 blur-[30px] rounded-full pointer-events-none" style={{ backgroundColor: `${c.color}20` }} />
                        <span className="text-xl">{c.emoji}</span>
                        <span className="text-white font-bold text-sm">{c.name}</span>
                        <span className="text-white/40 text-[11px]">{c.nodes}</span>
                        <span className="text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full w-fit" style={{ background: `${c.color}20`, color: c.color }}>
                            {c.freq}
                        </span>
                    </div>
                ))}
            </div>
            {/* Arrow down */}
            <div className="flex flex-col items-center gap-1 text-white/20">
                <div className="grid grid-cols-6 gap-3 w-full max-w-2xl px-8">
                    {CHAINS_DATA.map((c) => (
                        <div key={c.name} className="flex justify-center">
                            <svg className="w-4 h-6" fill="none" viewBox="0 0 16 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v16M4 14l4 6 4-6" />
                            </svg>
                        </div>
                    ))}
                </div>
            </div>
            {/* Central OVH Dashboard */}
            <div className="glass-card px-8 py-5 flex items-center gap-4 border border-[#00F0FF]/30 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
                <span className="text-2xl">📊</span>
                <div>
                    <div className="text-white font-black text-base">OVH Dashboard</div>
                    <div className="text-[#00F0FF] text-[11px] font-semibold mt-0.5">Market share · Provider breakdown · Geographic map</div>
                </div>
            </div>
        </div>
    );
}

/* ─── §2 — Data Pipeline ───────────────────────────────────────────────── */
function PipelineStep({ icon, title, sub, accent = false, note }: { icon: string; title: string; sub: string; accent?: boolean; note?: string }) {
    return (
        <div className={`glass-card p-4 flex items-start gap-3 ${accent ? 'border border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]' : ''}`}>
            <span className="text-xl mt-0.5 shrink-0">{icon}</span>
            <div>
                <div className={`font-bold text-sm ${accent ? 'text-[#00F0FF]' : 'text-white'}`}>{title}</div>
                <div className="text-white/40 text-[11px] mt-0.5">{sub}</div>
                {note && <div className="text-white/25 text-[10px] mt-1 italic">{note}</div>}
            </div>
        </div>
    );
}

function Arrow({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 pl-4">
            <div className="flex flex-col items-center w-6">
                <div className="w-px h-4 bg-white/15" />
                <svg className="w-3 h-3 text-white/20" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 10L1 4h10z" />
                </svg>
            </div>
            <span className="text-[10px] text-white/25 italic">{label}</span>
        </div>
    );
}

function PipelineChart() {
    return (
        <div className="max-w-lg w-full mx-auto flex flex-col gap-1">
            <PipelineStep icon="🌐" title="Blockchain Network (public RPC)" sub="Full list of active nodes with IP addresses" />
            <Arrow label="batch of all IPs" />
            <PipelineStep icon="🗄️" title="MaxMind GeoLite2" sub="Local database · ~7 MB · offline · < 1ms per IP" note="Returns: ASN + Organization name — e.g. AS16276 / OVH SAS" />
            <Arrow label="ASN match against 6 OVH identifiers" />

            {/* Fork */}
            <div className="pl-4 flex flex-col gap-1">
                <div className="text-[10px] text-white/25 italic pl-7 mb-1">Is OVH? (6 registered ASNs)</div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-bold text-green-400/60 pl-1 mb-1">✅ Yes → OVH node</div>
                        <PipelineStep icon="📍" title="Geo enrichment" sub="ip-api.com · City + GPS coordinates" accent />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-bold text-white/30 pl-1 mb-1">↩ No → competitor</div>
                        <PipelineStep icon="📊" title="Provider breakdown" sub="AWS, Google, Hetzner, DigitalOcean…" />
                    </div>
                </div>
            </div>

            <Arrow label="aggregated results" />
            <PipelineStep icon="✅" title="Final metrics" sub="Market share · Estimated revenue · Geographic map" accent />

            <div className="mt-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] text-[11px] text-white/30 leading-relaxed">
                <span className="text-[#00F0FF] font-bold">Performance: </span>
                ~4,000 Solana nodes analyzed in under 3 seconds — 150× fewer external API calls than a naive approach (25 calls instead of 4,000).
            </div>
        </div>
    );
}

/* ─── §3 — Reliability & Freshness ────────────────────────────────────── */
function FlowArrow() {
    return (
        <div className="flex justify-center items-center py-1">
            <svg className="w-4 h-5 text-white/15" fill="none" viewBox="0 0 16 20" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v13M3 11l5 6 5-6" />
            </svg>
        </div>
    );
}

function ReliabilityChart() {
    return (
        <div className="max-w-2xl w-full mx-auto space-y-6">

            {/* Part 1 — Background process */}
            <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-3">
                    Background — runs automatically, independently of any visit
                </div>
                <div className="flex flex-col">
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#9945FF]/15 border border-[#9945FF]/30">
                            <span className="text-sm">⏱</span>
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">Scheduled worker runs</div>
                            <div className="text-white/40 text-[11px] mt-0.5">Every 1h (Solana) · Every 2h (Avalanche, Sui, Tron, Hyperliquid)</div>
                        </div>
                    </div>
                    <FlowArrow />
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#00F0FF]/10 border border-[#00F0FF]/20">
                            <span className="text-sm">🔄</span>
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">Fetches + analyzes all nodes</div>
                            <div className="text-white/40 text-[11px] mt-0.5">RPC call → IP extraction → MaxMind lookup → OVH filter → metrics</div>
                        </div>
                    </div>
                    <FlowArrow />
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#627EEA]/15 border border-[#627EEA]/30">
                            <span className="text-sm">💾</span>
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">Saves result to database</div>
                            <div className="text-white/40 text-[11px] mt-0.5">Metrics stored with a timestamp · Ready to be served instantly</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Part 2 — User visit */}
            <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-3">
                    When a user visits the dashboard
                </div>
                <div className="flex flex-col">
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5 border border-white/10">
                            <span className="text-sm">👤</span>
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">Page opens in the browser</div>
                            <div className="text-white/40 text-[11px] mt-0.5">The dashboard requests data from the API</div>
                        </div>
                    </div>
                    <FlowArrow />
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#627EEA]/15 border border-[#627EEA]/30">
                            <span className="text-sm">🗃️</span>
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">API reads the pre-computed result</div>
                            <div className="text-white/40 text-[11px] mt-0.5">No live computation — the answer is already in the database</div>
                        </div>
                    </div>
                    <FlowArrow />
                    {/* 3 outcomes */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="glass-card p-3 border border-green-500/20 flex flex-col gap-1.5">
                            <div className="text-green-400 text-xs font-bold">✅ Data is fresh</div>
                            <div className="text-white/35 text-[11px] leading-relaxed">Served immediately. Response under 100ms.</div>
                        </div>
                        <div className="glass-card p-3 border border-yellow-500/20 flex flex-col gap-1.5">
                            <div className="text-yellow-400 text-xs font-bold">⚠️ Data is older than expected</div>
                            <div className="text-white/35 text-[11px] leading-relaxed">Still displayed with a small warning. Dashboard stays usable.</div>
                        </div>
                        <div className="glass-card p-3 border border-white/10 flex flex-col gap-1.5">
                            <div className="text-white/50 text-xs font-bold">🔄 No data yet</div>
                            <div className="text-white/35 text-[11px] leading-relaxed">Computed live on first ever startup only. Rare.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] text-[11px] text-white/30 leading-relaxed">
                <span className="text-[#00F0FF] font-bold">Why it matters: </span>
                The dashboard never blocks a visit to recalculate data. Even if a worker is delayed or the blockchain RPC is temporarily unreachable, the last known metrics are always shown.
            </div>
        </div>
    );
}

/* ─── §4 — What This Dashboard Is For ─────────────────────────────────── */
const USE_CASES = [
    {
        icon: '📣',
        label: 'Marketing & Proof of Presence',
        color: '#9945FF',
        description: 'A shareable, public-facing tool that demonstrates OVHcloud\'s real footprint across major blockchain networks — with live, verifiable numbers. Useful in presentations, press, and partner conversations.',
        features: ['Public dashboards per chain', 'Market share % updated automatically', 'Geographic distribution map', 'Provider benchmark (OVH vs AWS, Google…)'],
    },
    {
        icon: '🎯',
        label: 'Lead Capture at Events',
        color: '#00F0FF',
        description: 'During conferences and meetups, the dashboard serves as a conversation starter and a credibility proof. A built-in CRM (protected) lets the team log contacts directly on-site without any external tool.',
        features: ['Internal lead form accessible from the sidebar', 'Stores: name, org, country, job title, notes', 'No external CRM dependency', 'Accessible from any device with login'],
    },
    {
        icon: '📊',
        label: 'Internal Market Monitoring',
        color: '#627EEA',
        description: 'Gives the Web3 sales team a real-time view of OVH\'s position on each network — market share evolution, estimated monthly revenue per chain, and historical trend tracking.',
        features: ['Market share per blockchain over time', 'Estimated monthly revenue (Solana)', 'Historical trends (Analytics page)', 'Multi-chain comparison'],
    },
    {
        icon: '🏹',
        label: 'Hunting & Win-Back (Node Explorer)',
        color: '#E84142',
        description: 'The Node Explorer (protected) lists every validator and node on the network with their hosting provider. The team can identify high-value operators currently on a competitor and reach out directly.',
        features: ['Full node list with ASN, provider, country', 'Filter by provider (AWS, Hetzner, etc.)', 'Prospect scoring (Solana: top non-OVH validators)', 'Direct outreach starting point'],
    },
    {
        icon: '🚧',
        label: 'Community Sentiment — Not Yet Covered',
        color: '#a0a0a0',
        description: 'Tracking how the blockchain community perceives OVHcloud as an infrastructure provider — forum sentiment, social mentions, validator feedback — is identified as a gap. Not implemented yet.',
        features: ['Community forums & Discord monitoring', 'Validator satisfaction signals', 'Reputation tracking over time'],
        wip: true,
    },
];

function UseCasesChart() {
    return (
        <div className="max-w-2xl w-full mx-auto space-y-3">
            {USE_CASES.map((uc) => (
                <div
                    key={uc.label}
                    className={`glass-card p-5 relative overflow-hidden ${uc.wip ? 'opacity-60' : ''}`}
                    style={{ borderColor: `${uc.color}25` }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full pointer-events-none" style={{ backgroundColor: `${uc.color}10` }} />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{uc.icon}</span>
                            <span className="font-bold text-sm text-white">{uc.label}</span>
                            {uc.wip && (
                                <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/20 text-white/30">
                                    Not yet built
                                </span>
                            )}
                        </div>
                        <p className="text-white/45 text-[12px] leading-relaxed mb-3">{uc.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {uc.features.map((f) => (
                                <span
                                    key={f}
                                    className="text-[10px] px-2 py-0.5 rounded-full"
                                    style={{ background: `${uc.color}15`, color: uc.wip ? 'rgba(255,255,255,0.3)' : uc.color }}
                                >
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── §5 — Security ────────────────────────────────────────────────────── */
function SecurityChart() {
    return (
        <div className="max-w-2xl w-full mx-auto space-y-4">
            {/* Access flow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Public */}
                <div className="glass-card p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Public access</div>
                    <div className="flex items-center gap-2 mb-2">
                        <span>👤</span>
                        <span className="text-white/60 text-[11px]">Any visitor</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-white/40 text-[11px]">Metrics dashboards</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <svg className="w-4 h-4 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-white/40 text-[11px]">Analytics & About</span>
                    </div>
                </div>

                {/* Login flow */}
                <div className="glass-card p-4 border border-[#00F0FF]/20">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#00F0FF]/50 mb-3">Authentication</div>
                    <div className="space-y-2 text-[11px]">
                        <div className="flex items-start gap-2">
                            <span className="text-[#00F0FF] mt-0.5 shrink-0">1.</span>
                            <span className="text-white/50">Login with credentials at <code className="text-white/30">/login</code></span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-[#00F0FF] mt-0.5 shrink-0">2.</span>
                            <span className="text-white/50">Server generates a signed token (HMAC-SHA256)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-[#00F0FF] mt-0.5 shrink-0">3.</span>
                            <span className="text-white/50">Token stored in HTTP-only cookie (invisible to JavaScript)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-[#00F0FF] mt-0.5 shrink-0">4.</span>
                            <span className="text-white/50">Middleware verifies on every request — before page renders</span>
                        </div>
                    </div>
                </div>

                {/* Protected */}
                <div className="glass-card p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Protected access</div>
                    <div className="flex items-center gap-2 mb-2">
                        <span>🔒</span>
                        <span className="text-white/60 text-[11px]">Authenticated only</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="space-y-1">
                        {['Node lists (IP, ASN, city)', 'CRM Lead management', 'Benchmark & Roadmap', 'Methodology'].map((item) => (
                            <div key={item} className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-[#00F0FF]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-white/40 text-[10px]">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3 layers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    {
                        icon: '🔐',
                        title: 'HMAC-SHA256',
                        desc: 'Token signed with a server-side secret key. Impossible to forge without the key.',
                        color: '#9945FF',
                    },
                    {
                        icon: '🍪',
                        title: 'HTTP-only Cookie',
                        desc: 'Token inaccessible from browser JavaScript — blocks XSS session theft.',
                        color: '#00F0FF',
                    },
                    {
                        icon: '⏱',
                        title: 'Constant-time Comparison',
                        desc: 'Timing-safe verification prevents timing attacks that could guess the key.',
                        color: '#627EEA',
                    },
                ].map((layer) => (
                    <div key={layer.title} className="glass-card p-4" style={{ borderColor: `${layer.color}25` }}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{layer.icon}</span>
                            <span className="font-bold text-[11px]" style={{ color: layer.color }}>{layer.title}</span>
                        </div>
                        <p className="text-white/35 text-[11px] leading-relaxed">{layer.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── §6 — GTM Strategy & Ecosystem Segmentation ─────────────────────── */

const PYRAMID_TIERS = [
    {
        label: 'Foundations',
        shortDesc: '1 deal → entire ecosystem',
        actors: 'Solana Foundation, Celestia Labs, Polygon Labs, dYdX…',
        why: 'One partnership = official "recommended hosting" status. All operators downstream follow the foundation\'s docs and templates. Co-branded guides, pre-configured images, "Powered by OVHcloud" in their documentation.',
        priority: 'Highest priority',
        color: '#00F0FF',
        // Trapezoid: top-left%, top-right%, bottom-right%, bottom-left%
        clip: 'polygon(32% 0%, 68% 0%, 76% 100%, 24% 100%)',
        glow: 'rgba(0,240,255,0.25)',
    },
    {
        label: 'Institutional StaaS',
        shortDesc: '100s of servers per contract',
        actors: 'Figment, Chorus One, P2P.org, Kiln…',
        why: 'Fleet buyers managing billions in stake across 30–40+ chains. One contract = hundreds of recurring bare-metal servers with geo-redundancy requirements. These operators need multi-region resilience — a natural fit for OVH.',
        priority: 'Very high',
        color: '#9945FF',
        clip: 'polygon(24% 0%, 76% 0%, 86% 100%, 14% 100%)',
        glow: 'rgba(153,69,255,0.2)',
    },
    {
        label: 'Infra Consumers',
        shortDesc: 'Always-on, high bandwidth',
        actors: 'RPC providers (Alchemy, Infura), indexers, block explorers, oracle operators…',
        why: 'Always-on, high-bandwidth workloads. Full nodes and query-heavy services that need dedicated hardware 24/7 — volume play with predictable recurring revenue. Steady fleet that never turns off.',
        priority: 'Medium–high',
        color: '#627EEA',
        clip: 'polygon(14% 0%, 86% 0%, 94% 100%, 6% 100%)',
        glow: 'rgba(98,126,234,0.15)',
    },
    {
        label: 'Community Operators',
        shortDesc: '1–2 machines each',
        actors: 'Independent validators, solo SPOs, small staking setups…',
        why: 'Long tail — hundreds of actors with 1–2 machines each. Useful for visibility and community credibility, but doesn\'t scale as a primary GTM motion. Good for brand awareness, not for revenue.',
        priority: 'Lower',
        color: '#64748b',
        clip: 'polygon(6% 0%, 94% 0%, 98% 100%, 2% 100%)',
        glow: 'rgba(100,116,139,0.1)',
    },
];

const TRANSVERSAL_LAYERS = [
    {
        label: 'ZK Provers',
        shortDesc: 'GPU/FPGA premium',
        desc: 'GPU/FPGA-heavy proof generation for zkEVMs (Polygon zkEVM, Scroll, zkSync). Premium hardware margins. The next wave of compute-intensive demand.',
        color: '#F59E0B',
        horizon: '2026+',
    },
    {
        label: 'Restaking',
        shortDesc: 'EigenLayer AVSs',
        desc: 'Operators running multiple Actively Validated Services on shared infra. Same institutional operators, more modules per machine — multiplicative demand.',
        color: '#EF4444',
        horizon: 'Now → 2026',
    },
    {
        label: 'DA Layers',
        shortDesc: '25+ TiB NVMe',
        desc: 'Celestia Bridge nodes need 25+ TiB NVMe with massive bandwidth. Explosive growth as rollups multiply. Storage-intensive, bandwidth-hungry workloads.',
        color: '#22C55E',
        horizon: 'Now → 2026',
    },
];

function GTMChart() {
    const [hoveredTier, setHoveredTier] = useState<number | null>(null);
    const [hoveredTransversal, setHoveredTransversal] = useState<number | null>(null);

    return (
        <div className="max-w-4xl w-full mx-auto space-y-8">
            {/* Main layout: pyramid left, transversal right */}
            <div className="flex gap-6 items-stretch">
                {/* ── Pyramid ── */}
                <div className="flex-1 min-w-0">
                    <div
                        className="relative"
                        style={{ perspective: '900px' }}
                    >
                        <div
                            className="flex flex-col items-center gap-[3px]"
                            style={{
                                transformStyle: 'preserve-3d',
                                transform: 'rotateX(6deg)',
                            }}
                        >
                            {PYRAMID_TIERS.map((tier, i) => {
                                const isHovered = hoveredTier === i;
                                const isFaded = hoveredTier !== null && hoveredTier !== i;
                                return (
                                    <motion.div
                                        key={tier.label}
                                        className="w-full relative cursor-pointer"
                                        style={{ zIndex: isHovered ? 20 : 10 - i }}
                                        onMouseEnter={() => setHoveredTier(i)}
                                        onMouseLeave={() => setHoveredTier(null)}
                                        animate={{
                                            translateZ: isHovered ? 40 : 0,
                                            translateY: isHovered ? -6 : 0,
                                            scale: isHovered ? 1.03 : 1,
                                            opacity: isFaded ? 0.4 : 1,
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    >
                                        {/* Tier shape */}
                                        <div
                                            className="relative overflow-visible"
                                            style={{ clipPath: tier.clip }}
                                        >
                                            {/* Background */}
                                            <div
                                                className="relative px-8 py-5"
                                                style={{
                                                    background: isHovered
                                                        ? `linear-gradient(135deg, ${tier.color}25 0%, ${tier.color}08 50%, rgba(10,10,25,0.9) 100%)`
                                                        : `linear-gradient(135deg, ${tier.color}12 0%, rgba(10,10,25,0.95) 40%, rgba(10,10,25,0.85) 100%)`,
                                                    borderTop: `1px solid ${tier.color}${isHovered ? '50' : '20'}`,
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                {/* Glow effect on hover */}
                                                {isHovered && (
                                                    <div
                                                        className="absolute inset-0 pointer-events-none"
                                                        style={{
                                                            boxShadow: `inset 0 0 40px ${tier.glow}, 0 0 60px ${tier.glow}`,
                                                        }}
                                                    />
                                                )}

                                                {/* Content */}
                                                <div className="relative z-10 text-center">
                                                    <div className="font-black text-sm tracking-wide" style={{ color: isHovered ? tier.color : 'rgba(255,255,255,0.85)' }}>
                                                        {tier.label}
                                                    </div>
                                                    <div className="text-[11px] mt-0.5" style={{ color: isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>
                                                        {tier.shortDesc}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Priority indicator — small dot on the left edge */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 -left-3 w-1.5 h-1.5 rounded-full transition-all duration-300"
                                            style={{
                                                backgroundColor: tier.color,
                                                opacity: isHovered ? 1 : 0.3,
                                                boxShadow: isHovered ? `0 0 8px ${tier.color}` : 'none',
                                            }}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Pyramid side labels */}
                        <div className="flex justify-between mt-3 px-4 text-[9px] text-white/20 uppercase tracking-[0.15em]">
                            <span>← Fewer actors</span>
                            <span>More actors →</span>
                        </div>
                    </div>
                </div>

                {/* ── Transversal layers (right column) ── */}
                <div className="w-44 shrink-0 flex flex-col gap-2">
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 mb-1 text-center">
                        Cross-cutting
                    </div>

                    {/* Connecting line from pyramid */}
                    <div className="relative flex-1 flex flex-col gap-2">
                        {/* Vertical dashed line on the left */}
                        <div className="absolute left-0 top-2 bottom-2 w-px border-l border-dashed border-white/10" />

                        {TRANSVERSAL_LAYERS.map((layer, i) => {
                            const isHovered = hoveredTransversal === i;
                            return (
                                <motion.div
                                    key={layer.label}
                                    className="relative pl-3 cursor-pointer"
                                    onMouseEnter={() => setHoveredTransversal(i)}
                                    onMouseLeave={() => setHoveredTransversal(null)}
                                    animate={{
                                        x: isHovered ? 4 : 0,
                                        scale: isHovered ? 1.02 : 1,
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                >
                                    {/* Horizontal tick */}
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-px" style={{ backgroundColor: `${layer.color}40` }} />

                                    <div
                                        className="rounded-lg p-3 relative overflow-hidden transition-all duration-300"
                                        style={{
                                            background: isHovered
                                                ? `linear-gradient(135deg, ${layer.color}15 0%, rgba(10,10,25,0.9) 100%)`
                                                : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${layer.color}${isHovered ? '40' : '15'}`,
                                            boxShadow: isHovered ? `0 0 20px ${layer.color}15` : 'none',
                                        }}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div
                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                style={{ backgroundColor: layer.color }}
                                            />
                                            <span className="font-bold text-[11px] text-white/80">{layer.label}</span>
                                        </div>
                                        <div className="text-[10px] text-white/30">{layer.shortDesc}</div>
                                        <div
                                            className="text-[8px] font-bold uppercase tracking-widest mt-1.5"
                                            style={{ color: `${layer.color}90` }}
                                        >
                                            {layer.horizon}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Hover detail panel ── */}
            <AnimatePresence mode="wait">
                {hoveredTier !== null && (
                    <motion.div
                        key={`tier-${hoveredTier}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl p-5 relative overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, ${PYRAMID_TIERS[hoveredTier].color}08 0%, rgba(10,10,25,0.95) 50%)`,
                            border: `1px solid ${PYRAMID_TIERS[hoveredTier].color}25`,
                        }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-black text-base" style={{ color: PYRAMID_TIERS[hoveredTier].color }}>
                                        {PYRAMID_TIERS[hoveredTier].label}
                                    </span>
                                    <span
                                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                        style={{
                                            background: `${PYRAMID_TIERS[hoveredTier].color}15`,
                                            color: PYRAMID_TIERS[hoveredTier].color,
                                        }}
                                    >
                                        {PYRAMID_TIERS[hoveredTier].priority}
                                    </span>
                                </div>
                                <div className="text-white/50 text-[12px] mb-2 font-medium">{PYRAMID_TIERS[hoveredTier].actors}</div>
                                <div className="text-white/35 text-[12px] leading-relaxed">{PYRAMID_TIERS[hoveredTier].why}</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {hoveredTransversal !== null && hoveredTier === null && (
                    <motion.div
                        key={`trans-${hoveredTransversal}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl p-5 relative overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, ${TRANSVERSAL_LAYERS[hoveredTransversal].color}08 0%, rgba(10,10,25,0.95) 50%)`,
                            border: `1px solid ${TRANSVERSAL_LAYERS[hoveredTransversal].color}25`,
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: TRANSVERSAL_LAYERS[hoveredTransversal].color }}
                            />
                            <span className="font-black text-base" style={{ color: TRANSVERSAL_LAYERS[hoveredTransversal].color }}>
                                {TRANSVERSAL_LAYERS[hoveredTransversal].label}
                            </span>
                            <span
                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{
                                    background: `${TRANSVERSAL_LAYERS[hoveredTransversal].color}15`,
                                    color: TRANSVERSAL_LAYERS[hoveredTransversal].color,
                                }}
                            >
                                {TRANSVERSAL_LAYERS[hoveredTransversal].horizon}
                            </span>
                        </div>
                        <div className="text-white/40 text-[12px] leading-relaxed">{TRANSVERSAL_LAYERS[hoveredTransversal].desc}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Strategic takeaway ── */}
            <div className="p-4 rounded-xl border border-[#00F0FF]/15 bg-[#00F0FF]/[0.03]">
                <div className="text-[#00F0FF] font-bold text-xs mb-2">Strategic takeaway</div>
                <div className="text-white/40 text-[12px] leading-relaxed space-y-2">
                    <p>
                        <strong className="text-white/60">Short term:</strong> Target institutional StaaS operators and chain foundations. One enterprise deal replaces hundreds of individual node runner contracts.
                    </p>
                    <p>
                        <strong className="text-white/60">Medium term:</strong> Develop official foundation partnerships — co-branded guides, pre-configured images, recommended hosting status.
                    </p>
                    <p>
                        <strong className="text-white/60">Long term:</strong> Position on emerging cross-cutting segments — ZK provers, DA nodes, and EigenLayer AVSs.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function MethodologyPage() {

    const sections = [
        {
            number: '1',
            title: 'What the Dashboard Measures',
            subtitle: 'Six blockchain networks are continuously monitored to track OVHcloud\'s market share as an infrastructure host. Each network has its own update frequency based on how quickly its validator set changes.',
            chart: <NetworksChart />,
        },
        {
            number: '2',
            title: 'How the Data Is Collected',
            subtitle: 'Each blockchain exposes a public RPC interface. The system fetches all active nodes, extracts their IP addresses, then identifies their hosting provider using a local offline database — with no manual intervention.',
            chart: <PipelineChart />,
        },
        {
            number: '3',
            title: 'Data Reliability & Freshness',
            subtitle: 'Data is never computed on-the-fly during a visit. Automated background workers pre-compute metrics on a schedule and store them in the database. A 3-level fallback strategy ensures the dashboard is always available.',
            chart: <ReliabilityChart />,
        },
        {
            number: '4',
            title: 'What This Dashboard Is For',
            subtitle: 'Four concrete use cases — and one identified gap. The dashboard was built to serve the Web3 sales team across the full commercial cycle: prove presence, capture leads, monitor performance, and identify win-back opportunities.',
            chart: <UseCasesChart />,
        },
        {
            number: '5',
            title: 'Security & Access Control',
            subtitle: 'Authentication is handled entirely in-house — no third-party service. A cryptographically signed session token protects all sensitive pages, verified before any content is rendered.',
            chart: <SecurityChart />,
        },
        {
            number: '6',
            title: 'GTM Strategy & Ecosystem Segmentation',
            subtitle: 'The blockchain infrastructure market is not homogeneous. Understanding where the volume and revenue concentrate — and who the real decision-makers are — shapes how this dashboard is built and who it targets.',
            chart: <GTMChart />,
        },
    ];

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col bg-[#050510]">
            <ParticlesBackground />

            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(1,83,212,0.12)' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(0,240,255,0.08)' }} />

            <div className="relative z-10 max-w-4xl mx-auto w-full px-6 py-16">
                {/* Header */}
                <motion.div {...fadeUp(0)} className="mb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00F0FF] opacity-60">Internal · Authenticated</span>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-4 bg-gradient-to-r from-white via-white/80 to-[#00F0FF] bg-clip-text text-transparent">
                        How It Works
                    </h1>
                    <p className="text-white/40 text-lg max-w-2xl leading-relaxed">
                        A complete walkthrough of the OVH Blockchain Tracker — from raw blockchain data to the metrics displayed on this dashboard. Follow the data from source to screen.
                    </p>
                </motion.div>

                {/* Sections */}
                <div className="space-y-20">
                    {sections.map((s, i) => (
                        <motion.section key={s.number} {...fadeUp(0.1 * i)}>
                            <SectionTitle number={s.number} title={s.title} subtitle={s.subtitle} />
                            <div className="mt-6">
                                {s.chart}
                            </div>
                            {i < sections.length - 1 && (
                                <div className="mt-16 h-px bg-white/5" />
                            )}
                        </motion.section>
                    ))}
                </div>

                {/* Footer */}
                <motion.div {...fadeUp(0.3)} className="mt-20 pt-8 border-t border-white/5 text-center">
                    <p className="text-white/20 text-[11px] uppercase tracking-[0.2em]">
                        OVH Blockchain Tracker · Internal Documentation · April 2026
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

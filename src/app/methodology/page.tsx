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
        label: 'Chain Core Teams',
        shortDesc: 'Define specs, few servers',
        actors: 'Solana Foundation, Polygon Labs, Celestia Labs, Ava Labs, Mysten Labs (Sui)…',
        why: 'Run reference validators, sequencers, boot nodes, public RPCs and testnets. Moderate bare-metal volume per org — but they define the hardware specs everyone else follows. One official partnership cascades to every operator on the network.',
        priority: 'Strategic',
        color: '#00F0FF',
        darkColor: '#007A80',
        lightColor: '#33F5FF',
    },
    {
        label: 'Institutional Operators',
        shortDesc: '100s of servers per contract',
        actors: 'Figment, Chorus One, P2P.org, Kiln, Blockdaemon, Everstake…',
        why: 'Run geo-redundant validator fleets across 30–40+ chains. Largest bare-metal consumers by volume — one contract means hundreds of high-spec dedicated servers (32–64 cores, 128–512 GB RAM, NVMe) with multi-region failover requirements.',
        priority: 'Highest volume',
        color: '#9945FF',
        darkColor: '#5A2899',
        lightColor: '#B370FF',
    },
    {
        label: 'RPC & Data Infra',
        shortDesc: 'Always-on full-node fleets',
        actors: 'Alchemy, Infura, QuickNode, Chainstack, The Graph, Chainlink, Etherscan…',
        why: 'Run always-on full-node fleets serving API queries 24/7. Bandwidth-heavy, low-latency workloads. Predictable recurring demand — these servers never turn off. High total volume across dozens of providers.',
        priority: 'High volume',
        color: '#627EEA',
        darkColor: '#3A4C8C',
        lightColor: '#8DA0F0',
    },
    {
        label: 'Solo Validators',
        shortDesc: '1–2 machines each',
        actors: 'Independent Solana validators, Ethereum home stakers, Avalanche node runners…',
        why: 'Long tail — hundreds of operators with 1–2 bare-metal servers each. Good for community credibility and brand visibility among builders, but doesn\'t scale as a primary sales motion.',
        priority: 'Long tail',
        color: '#64748B',
        darkColor: '#3B4453',
        lightColor: '#8E99AB',
    },
];

const TRANSVERSAL_LAYERS = [
    {
        label: 'ZK Provers',
        shortDesc: 'GPU-intensive',
        desc: 'Proof generation for zkEVMs and ZK rollups (Polygon zkEVM, Scroll, zkSync, Starknet). Requires GPU/FPGA-accelerated bare metal — high margins, premium hardware. Run by L2 core teams, specialized prover services, and increasingly decentralized prover networks.',
        color: '#F59E0B',
        hwProfile: 'GPU / FPGA',
    },
    {
        label: 'Restaking / AVSs',
        shortDesc: 'Multi-service CPU',
        desc: 'EigenLayer operators running multiple Actively Validated Services (oracles, bridges, DA, sequencing) on shared infrastructure. The same institutional operators adding modules — multiplicative bare-metal demand on top of their existing validator fleets.',
        color: '#EF4444',
        hwProfile: 'CPU + Memory',
    },
    {
        label: 'DA Nodes',
        shortDesc: 'Storage-intensive',
        desc: 'Celestia Bridge/Light nodes, EigenDA operators, Avail nodes. Require 6–25+ TiB NVMe with high sustained bandwidth. Volume growing fast as the number of rollups posting data multiplies.',
        color: '#22C55E',
        hwProfile: 'NVMe + Bandwidth',
    },
];

/* Pyramid SVG geometry helpers */
const ISO = { dx: 20, dy: -12 };
const PYR_CX = 210;
const TIER_HEIGHT = 56;
const TIER_GAP = 3;
const PYR_Y0 = 26;
const PYR_BASE_W = 360;
const PYR_TOP_RATIO = 0.28;
const TRANS_X = 500;
const TRANS_W = 140;
const TRANS_CARD_H = 56;
const TRANS_CARD_GAP = 14;
const TRANS_Y0 = 32;

function computePyramidGeo() {
    const N = PYRAMID_TIERS.length;
    const widths = Array.from({ length: N + 1 }, (_, i) =>
        (PYR_TOP_RATIO + (1 - PYR_TOP_RATIO) * (i / N)) * PYR_BASE_W
    );

    return widths.slice(0, N).map((tw, i) => {
        const bw = widths[i + 1];
        const y = PYR_Y0 + i * (TIER_HEIGHT + TIER_GAP);
        const ftl: [number, number] = [PYR_CX - tw / 2, y];
        const ftr: [number, number] = [PYR_CX + tw / 2, y];
        const fbr: [number, number] = [PYR_CX + bw / 2, y + TIER_HEIGHT];
        const fbl: [number, number] = [PYR_CX - bw / 2, y + TIER_HEIGHT];
        const pts = (arr: [number, number][]) => 'M' + arr.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + 'Z';

        return {
            front: pts([ftl, ftr, fbr, fbl]),
            side: pts([ftr, [ftr[0] + ISO.dx, ftr[1] + ISO.dy], [fbr[0] + ISO.dx, fbr[1] + ISO.dy], fbr]),
            top: i === 0 ? pts([[ftl[0] + ISO.dx, ftl[1] + ISO.dy], [ftr[0] + ISO.dx, ftr[1] + ISO.dy], ftr, ftl]) : null,
            cx: PYR_CX,
            cy: y + TIER_HEIGHT / 2,
            rightMidX: (ftr[0] + fbr[0]) / 2 + ISO.dx * 0.6,
            rightMidY: y + TIER_HEIGHT / 2,
        };
    });
}

function computeTransGeo() {
    return TRANSVERSAL_LAYERS.map((_, i) => ({
        x: TRANS_X,
        y: TRANS_Y0 + i * (TRANS_CARD_H + TRANS_CARD_GAP),
        w: TRANS_W,
        h: TRANS_CARD_H,
        cy: TRANS_Y0 + i * (TRANS_CARD_H + TRANS_CARD_GAP) + TRANS_CARD_H / 2,
    }));
}

const PYRAMID_GEO = computePyramidGeo();
const TRANS_GEO = computeTransGeo();
const SVG_W = 660;
const SVG_H = PYR_Y0 + PYRAMID_TIERS.length * (TIER_HEIGHT + TIER_GAP) - TIER_GAP + 20;

function GTMChart() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [hoveredTrans, setHoveredTrans] = useState<number | null>(null);

    return (
        <div className="max-w-4xl w-full mx-auto space-y-8">
            {/* ── SVG Visualization ── */}
            <div className="relative">
                {/* Ambient glow blobs behind the SVG */}
                {PYRAMID_TIERS.map((t, i) => (
                    <div
                        key={`glow-${i}`}
                        className="absolute rounded-full pointer-events-none transition-opacity duration-700"
                        style={{
                            width: 180 + i * 30,
                            height: 90 + i * 15,
                            left: `${10 + i * 8}%`,
                            top: `${10 + i * 20}%`,
                            background: `radial-gradient(ellipse, ${t.color}18 0%, transparent 70%)`,
                            opacity: hovered === i ? 1 : 0.4,
                            filter: 'blur(30px)',
                        }}
                    />
                ))}

                {/* Noise texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-20 rounded-xl"
                    style={{
                        opacity: 0.035,
                        mixBlendMode: 'overlay',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        backgroundSize: '128px 128px',
                    }}
                />

                <svg
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className="w-full relative z-10"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        {/* Gradient strokes per tier */}
                        {PYRAMID_TIERS.map((t, i) => (
                            <linearGradient key={`gs-${i}`} id={`tier-stroke-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={t.lightColor} stopOpacity={0.8} />
                                <stop offset="50%" stopColor={t.color} stopOpacity={0.4} />
                                <stop offset="100%" stopColor={t.color} stopOpacity={0.1} />
                            </linearGradient>
                        ))}

                        {/* Glow filter */}
                        <filter id="tier-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Shimmer gradient — sweeping light on top tier */}
                        <linearGradient id="shimmer-sweep" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="0">
                            <stop offset="0%" stopColor="white" stopOpacity="0" />
                            <stop offset="40%" stopColor="white" stopOpacity="0" />
                            <stop offset="50%" stopColor="white" stopOpacity="0.07" />
                            <stop offset="60%" stopColor="white" stopOpacity="0" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                            <animateTransform
                                attributeName="gradientTransform"
                                type="translate"
                                from="-300 0"
                                to="500 0"
                                dur="3.5s"
                                repeatCount="indefinite"
                            />
                        </linearGradient>

                        {/* Clip paths for shimmer */}
                        <clipPath id="tier0-clip">
                            <path d={PYRAMID_GEO[0].front} />
                        </clipPath>

                        {/* Card glow filter */}
                        <filter id="card-glow" x="-10%" y="-10%" width="120%" height="120%">
                            <feGaussianBlur stdDeviation="4" />
                        </filter>
                    </defs>

                    {/* ── Pyramid tiers ── */}
                    {PYRAMID_GEO.map((g, i) => {
                        const tier = PYRAMID_TIERS[i];
                        const isHov = hovered === i;
                        const isFaded = hovered !== null && hovered !== i;

                        return (
                            <g
                                key={`tier-${i}`}
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Hover glow layer (behind everything) */}
                                {isHov && (
                                    <path
                                        d={g.front}
                                        fill={`${tier.color}15`}
                                        stroke={tier.color}
                                        strokeWidth={2}
                                        filter="url(#tier-glow)"
                                        style={{ transition: 'all 0.3s ease' }}
                                    />
                                )}

                                {/* Top face — only tier 0 */}
                                {g.top && (
                                    <path
                                        d={g.top}
                                        fill={`${tier.color}${isHov ? '18' : '0A'}`}
                                        stroke={`url(#tier-stroke-${i})`}
                                        strokeWidth={0.5}
                                        style={{
                                            opacity: isFaded ? 0.25 : 1,
                                            transition: 'all 0.4s ease',
                                            transform: isHov ? 'translate(-3px, -5px)' : 'translate(0, 0)',
                                        }}
                                    />
                                )}

                                {/* Side face (isometric depth) */}
                                <path
                                    d={g.side}
                                    fill={`${tier.darkColor}${isHov ? '50' : '30'}`}
                                    stroke={`${tier.color}15`}
                                    strokeWidth={0.5}
                                    style={{
                                        opacity: isFaded ? 0.25 : 1,
                                        transition: 'all 0.4s ease',
                                        transform: isHov ? 'translate(-3px, -5px)' : 'translate(0, 0)',
                                    }}
                                />

                                {/* Front face */}
                                <path
                                    d={g.front}
                                    fill={`${tier.color}${isHov ? '14' : '0A'}`}
                                    stroke={`url(#tier-stroke-${i})`}
                                    strokeWidth={isHov ? 1.5 : 0.7}
                                    style={{
                                        opacity: isFaded ? 0.25 : 1,
                                        transition: 'all 0.4s ease',
                                        transform: isHov ? 'translate(-3px, -5px)' : 'translate(0, 0)',
                                    }}
                                />

                                {/* Shimmer sweep — top tier only */}
                                {i === 0 && (
                                    <rect
                                        x="0" y="0"
                                        width={SVG_W} height={SVG_H}
                                        fill="url(#shimmer-sweep)"
                                        clipPath="url(#tier0-clip)"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                )}

                                {/* Label */}
                                <text
                                    x={g.cx}
                                    y={g.cy - 7}
                                    textAnchor="middle"
                                    fill={isHov ? tier.color : 'rgba(255,255,255,0.85)'}
                                    fontSize={13}
                                    fontWeight={800}
                                    letterSpacing="0.03em"
                                    style={{
                                        opacity: isFaded ? 0.25 : 1,
                                        transition: 'all 0.4s ease',
                                        transform: isHov ? 'translate(-3px, -5px)' : 'translate(0, 0)',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {tier.label}
                                </text>
                                <text
                                    x={g.cx}
                                    y={g.cy + 10}
                                    textAnchor="middle"
                                    fill={isHov ? `${tier.color}CC` : 'rgba(255,255,255,0.3)'}
                                    fontSize={9.5}
                                    fontWeight={500}
                                    style={{
                                        opacity: isFaded ? 0.25 : 1,
                                        transition: 'all 0.4s ease',
                                        transform: isHov ? 'translate(-3px, -5px)' : 'translate(0, 0)',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {tier.shortDesc}
                                </text>
                            </g>
                        );
                    })}

                    {/* ── Vertical bracket spanning full pyramid height ── */}
                    {(() => {
                        const bracketX = TRANS_X - 22;
                        const topY = PYR_Y0;
                        const botY = PYR_Y0 + PYRAMID_TIERS.length * (TIER_HEIGHT + TIER_GAP) - TIER_GAP;
                        const midY = (topY + botY) / 2;
                        return (
                            <g>
                                {/* Vertical line */}
                                <line
                                    x1={bracketX} y1={topY + 6}
                                    x2={bracketX} y2={botY - 6}
                                    stroke="rgba(255,255,255,0.08)"
                                    strokeWidth={1}
                                    strokeDasharray="3 4"
                                />
                                {/* Top tick */}
                                <line x1={bracketX - 4} y1={topY + 6} x2={bracketX + 4} y2={topY + 6} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
                                {/* Bottom tick */}
                                <line x1={bracketX - 4} y1={botY - 6} x2={bracketX + 4} y2={botY - 6} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
                                {/* "All tiers" label */}
                                <text
                                    x={bracketX}
                                    y={midY}
                                    textAnchor="middle"
                                    fill="rgba(255,255,255,0.12)"
                                    fontSize={7}
                                    fontWeight={600}
                                    letterSpacing="0.15em"
                                    transform={`rotate(-90, ${bracketX}, ${midY})`}
                                >
                                    SPANS ALL TIERS
                                </text>
                            </g>
                        );
                    })()}

                    {/* ── Transversal layer cards (SVG) ── */}
                    {TRANS_GEO.map((g, i) => {
                        const layer = TRANSVERSAL_LAYERS[i];
                        const isHov = hoveredTrans === i;
                        return (
                            <g
                                key={`trans-${i}`}
                                onMouseEnter={() => setHoveredTrans(i)}
                                onMouseLeave={() => setHoveredTrans(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Card glow */}
                                {isHov && (
                                    <rect
                                        x={g.x - 4}
                                        y={g.y - 4}
                                        width={g.w + 8}
                                        height={g.h + 8}
                                        rx={12}
                                        fill={`${layer.color}08`}
                                        stroke={layer.color}
                                        strokeWidth={1}
                                        strokeOpacity={0.3}
                                        filter="url(#card-glow)"
                                    />
                                )}
                                {/* Card background */}
                                <rect
                                    x={g.x}
                                    y={g.y}
                                    width={g.w}
                                    height={g.h}
                                    rx={8}
                                    fill={isHov ? `${layer.color}0A` : 'rgba(255,255,255,0.02)'}
                                    stroke={layer.color}
                                    strokeWidth={isHov ? 1 : 0.5}
                                    strokeOpacity={isHov ? 0.4 : 0.15}
                                    style={{ transition: 'all 0.3s ease' }}
                                />
                                {/* Color accent bar */}
                                <rect
                                    x={g.x}
                                    y={g.y}
                                    width={3}
                                    height={g.h}
                                    rx={1.5}
                                    fill={layer.color}
                                    opacity={isHov ? 0.8 : 0.4}
                                    style={{ transition: 'opacity 0.3s ease' }}
                                />
                                {/* Label */}
                                <text
                                    x={g.x + 14}
                                    y={g.cy - 8}
                                    fill={isHov ? layer.color : 'rgba(255,255,255,0.8)'}
                                    fontSize={11}
                                    fontWeight={700}
                                    style={{ transition: 'fill 0.3s ease' }}
                                >
                                    {layer.label}
                                </text>
                                {/* Sub-label */}
                                <text
                                    x={g.x + 14}
                                    y={g.cy + 5}
                                    fill="rgba(255,255,255,0.3)"
                                    fontSize={9}
                                >
                                    {layer.shortDesc}
                                </text>
                                {/* Hardware profile badge */}
                                <text
                                    x={g.x + 14}
                                    y={g.cy + 19}
                                    fill={`${layer.color}90`}
                                    fontSize={7.5}
                                    fontWeight={700}
                                    letterSpacing="0.08em"
                                >
                                    {layer.hwProfile.toUpperCase()}
                                </text>
                            </g>
                        );
                    })}

                    {/* Cross-cutting label */}
                    <text x={TRANS_X + TRANS_W / 2} y={TRANS_Y0 - 12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={7.5} fontWeight={700} letterSpacing="0.18em">
                        CROSS-CUTTING
                    </text>
                </svg>
            </div>

            {/* ── Hover detail panel (glassmorphism) ── */}
            <AnimatePresence mode="wait">
                {hovered !== null && (
                    <motion.div
                        key={`tier-${hovered}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-xl p-5 relative overflow-hidden"
                        style={{
                            background: 'rgba(10,10,25,0.65)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: `1px solid ${PYRAMID_TIERS[hovered].color}30`,
                            boxShadow: `0 0 40px ${PYRAMID_TIERS[hovered].color}08`,
                        }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="font-black text-base" style={{ color: PYRAMID_TIERS[hovered].color }}>
                                {PYRAMID_TIERS[hovered].label}
                            </span>
                            <span
                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{
                                    background: `${PYRAMID_TIERS[hovered].color}15`,
                                    color: PYRAMID_TIERS[hovered].color,
                                }}
                            >
                                {PYRAMID_TIERS[hovered].priority}
                            </span>
                        </div>
                        <div className="text-white/50 text-[12px] mb-2 font-medium">{PYRAMID_TIERS[hovered].actors}</div>
                        <div className="text-white/35 text-[12px] leading-relaxed">{PYRAMID_TIERS[hovered].why}</div>
                    </motion.div>
                )}

                {hoveredTrans !== null && hovered === null && (
                    <motion.div
                        key={`trans-${hoveredTrans}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-xl p-5 relative overflow-hidden"
                        style={{
                            background: 'rgba(10,10,25,0.65)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: `1px solid ${TRANSVERSAL_LAYERS[hoveredTrans].color}30`,
                            boxShadow: `0 0 40px ${TRANSVERSAL_LAYERS[hoveredTrans].color}08`,
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TRANSVERSAL_LAYERS[hoveredTrans].color }} />
                            <span className="font-black text-base" style={{ color: TRANSVERSAL_LAYERS[hoveredTrans].color }}>
                                {TRANSVERSAL_LAYERS[hoveredTrans].label}
                            </span>
                            <span
                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{
                                    background: `${TRANSVERSAL_LAYERS[hoveredTrans].color}15`,
                                    color: TRANSVERSAL_LAYERS[hoveredTrans].color,
                                }}
                            >
                                {TRANSVERSAL_LAYERS[hoveredTrans].hwProfile}
                            </span>
                        </div>
                        <div className="text-white/40 text-[12px] leading-relaxed">{TRANSVERSAL_LAYERS[hoveredTrans].desc}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Strategic takeaway ── */}
            <div
                className="p-4 rounded-xl relative overflow-hidden"
                style={{
                    background: 'rgba(0,240,255,0.02)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,240,255,0.12)',
                }}
            >
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
            title: 'Bare-Metal Demand Map',
            subtitle: 'Who actually consumes dedicated servers in blockchain — and how much. This segmentation focuses specifically on bare-metal infrastructure buyers, not the broader ecosystem (exchanges, wallets, DeFi protocols have different infra patterns). Width = number of actors, height = strategic impact per deal.',
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

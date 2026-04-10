import type { ChainId } from '@/lib/chains';
import { USE_CASES_CONFIG } from '@/lib/config/use-cases-config';

interface OVHServerSpecsProps {
    chainId: ChainId;
    accent: string;
}

function fmtEur(n: number): string {
    if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
    return `€${n}`;
}

export default function OVHServerSpecs({ chainId, accent }: OVHServerSpecsProps) {
    const config = USE_CASES_CONFIG[chainId];
    if (!config?.serverSpecs?.length) return null;

    return (
        <div className="mb-16">
            <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    Recommended OVH <span style={{ color: accent }}>Infrastructure</span>
                </h2>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">
                    Official specs · Pricelist April 2026
                </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/8 bg-white/2">
                            <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Node Type</th>
                            <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">CPU</th>
                            <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">RAM</th>
                            <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Storage</th>
                            <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Network</th>
                            <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">OVH Server</th>
                            <th className="px-5 py-3 text-right text-[9px] font-black uppercase tracking-widest text-white/30">€/mo</th>
                            <th className="px-5 py-3 text-center text-[9px] font-black uppercase tracking-widest text-white/30" />
                        </tr>
                    </thead>
                    <tbody>
                        {config.serverSpecs.map((spec, i) => (
                            <tr
                                key={spec.nodeType}
                                className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i === config.serverSpecs.length - 1 ? 'border-b-0' : ''}`}
                            >
                                <td className="px-5 py-4">
                                    <span className="font-bold text-white/80">{spec.nodeType}</span>
                                </td>
                                <td className="px-5 py-4 text-white/50 text-xs font-mono">{spec.cpu}</td>
                                <td className="px-5 py-4 text-white/50 text-xs font-mono">{spec.ram}</td>
                                <td className="px-5 py-4 text-white/50 text-xs">{spec.storage}</td>
                                <td className="px-5 py-4 text-white/50 text-xs">{spec.network}</td>
                                <td className="px-5 py-4">
                                    <span
                                        className="text-[10px] font-black px-2 py-1 rounded-lg border"
                                        style={{ color: accent, borderColor: `${accent}30`, background: `${accent}10` }}
                                    >
                                        {spec.ovhServer}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right font-black text-white">
                                    {fmtEur(spec.priceEur)}
                                </td>
                                <td className="px-5 py-4 text-center">
                                    {spec.ovhServerUrl ? (
                                        <a
                                            href={spec.ovhServerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all duration-200 hover:opacity-80"
                                            style={{ color: accent, borderColor: `${accent}40`, background: `${accent}08` }}
                                        >
                                            Order now
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </a>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-[9px] text-white/20 mt-2 italic">
                * Conservative estimate — base configuration. Additional RAM / storage options available depending on workload.
            </p>
        </div>
    );
}

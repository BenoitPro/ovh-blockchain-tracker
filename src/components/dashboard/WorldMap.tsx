'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import { CHAINS, ChainId } from '@/lib/chains';
import { motion, AnimatePresence } from 'framer-motion';
import { ServerIcon, ChartPieIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Globe = dynamic(() => import('react-globe.gl'), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-[#00F0FF]/30 border-t-[#00F0FF] animate-spin"></div>
        </div>
    )
});

interface WorldMapProps {
    geoDistribution: Record<string, number>;
    globalGeoDistribution?: Record<string, number>;
    /** Called when user clicks a country dot; receives the 2-letter ISO code */
    onCountryClick?: (isoCode: string) => void;
    // New KPI props for discrete display
    totalNodes?: number;
    ovhNodes?: number;
    marketShare?: number;
}

// Keys are ISO 3166-1 alpha-2 codes (same as MaxMind countryCode)
const COUNTRY_COORDS: Record<string, { coordinates: [number, number]; name: string; code: string }> = {
    'FR': { coordinates: [2.2137, 46.2276], name: 'France', code: 'FR' },
    'DE': { coordinates: [10.4515, 51.1657], name: 'Germany', code: 'DE' },
    'GB': { coordinates: [-3.4360, 55.3781], name: 'UK', code: 'GB' },
    'NL': { coordinates: [5.2913, 52.1326], name: 'Netherlands', code: 'NL' },
    'ES': { coordinates: [-3.7492, 40.4637], name: 'Spain', code: 'ES' },
    'IT': { coordinates: [12.5674, 41.8719], name: 'Italy', code: 'IT' },
    'PL': { coordinates: [19.1451, 51.9194], name: 'Poland', code: 'PL' },
    'SE': { coordinates: [18.6435, 60.1282], name: 'Sweden', code: 'SE' },
    'CH': { coordinates: [8.2275, 46.8182], name: 'Switzerland', code: 'CH' },
    'BE': { coordinates: [4.4699, 50.5039], name: 'Belgium', code: 'BE' },
    'FI': { coordinates: [25.7482, 61.9241], name: 'Finland', code: 'FI' },
    'US': { coordinates: [-95.7129, 37.0902], name: 'USA', code: 'US' },
    'CA': { coordinates: [-106.3468, 56.1304], name: 'Canada', code: 'CA' },
    'SG': { coordinates: [103.8198, 1.3521], name: 'Singapore', code: 'SG' },
    'JP': { coordinates: [138.2529, 36.2048], name: 'Japan', code: 'JP' },
    'CN': { coordinates: [104.1954, 35.8617], name: 'China', code: 'CN' },
    'IN': { coordinates: [78.9629, 20.5937], name: 'India', code: 'IN' },
    'KR': { coordinates: [127.7669, 35.9078], name: 'S. Korea', code: 'KR' },
    'RU': { coordinates: [105.3188, 61.5240], name: 'Russia', code: 'RU' },
    'AU': { coordinates: [133.7751, -25.2744], name: 'Australia', code: 'AU' },
    'BR': { coordinates: [-51.9253, -14.2350], name: 'Brazil', code: 'BR' },
};


export default function WorldMap({
    geoDistribution,
    globalGeoDistribution,
    onCountryClick,
    totalNodes,
    ovhNodes,
    marketShare
}: WorldMapProps) {
    const globeRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useNetworkTheme();
    // Default to 'global' if totalNodes is missing (meaning we are on network overview rather than ovh specific view)
    const [viewMode, setViewMode] = useState<'ovh' | 'global'>('global');
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [countriesGeoJson, setCountriesGeoJson] = useState<any>({ features: [] });
    const [hoveredPolygon, setHoveredPolygon] = useState<any>(null);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const currentChain = CHAINS[theme as ChainId] || CHAINS.solana;
    const accent = currentChain.accent;
    let r = 255, g = 255, b = 255;
    if (accent.startsWith('#')) {
        r = parseInt(accent.slice(1, 3), 16);
        g = parseInt(accent.slice(3, 5), 16);
        b = parseInt(accent.slice(5, 7), 16);
    }
    const accentRgb = `${r}, ${g}, ${b}`;


    // Stable globe image URL — consistent dark earth texture across all blockchains
    const globeImageUrl = useMemo(() => {
        return "//unpkg.com/three-globe/example/img/earth-dark.jpg";
    }, []); // permanent dark texture

    const activeDistribution = (viewMode === 'global' && globalGeoDistribution)
        ? globalGeoDistribution
        : geoDistribution;

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(setCountriesGeoJson);
    }, []);

    const rotationTimerRef = useRef<NodeJS.Timeout>(null);
    
    useEffect(() => {
        return () => {
            if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Keyed by ISO_A2 code — matches MaxMind countryCode format
    const dynamicCountryCoords = useMemo(() => {
        if (!countriesGeoJson.features?.length) return {};
        const result: Record<string, { coordinates: [number, number]; name: string; code: string }> = {};
        for (const feature of countriesGeoJson.features) {
            const name: string = feature.properties?.ADMIN || feature.properties?.NAME;
            const code: string = feature.properties?.ISO_A2;
            if (!name || !code || code === '-1' || code === '-99') continue;
            const pts: number[][] = [];
            const geom = feature.geometry;
            if (geom?.type === 'Polygon') {
                pts.push(...geom.coordinates[0]);
            } else if (geom?.type === 'MultiPolygon') {
                for (const poly of geom.coordinates) pts.push(...poly[0]);
            }
            if (!pts.length) continue;
            const lng = pts.reduce((s: number, c: number[]) => s + c[0], 0) / pts.length;
            const lat = pts.reduce((s: number, c: number[]) => s + c[1], 0) / pts.length;
            result[code] = { coordinates: [lng, lat], name, code };
        }
        return result;
    }, [countriesGeoJson]);

    // Maps Intl.DisplayNames output ("France", "United States") → ISO-2 code ("FR", "US").
    // MigaLabs stores geoDistribution with full country names; COUNTRY_COORDS uses ISO codes.
    const displayNameToIso = useMemo(() => {
        const result: Record<string, string> = {};
        try {
            const dn = new Intl.DisplayNames(['en'], { type: 'region' });
            const allIsoCodes = [
                ...Object.keys(COUNTRY_COORDS),
                ...Object.keys(dynamicCountryCoords),
            ];
            for (const iso of allIsoCodes) {
                try { const name = dn.of(iso); if (name) result[name] = iso; } catch { /* skip */ }
            }
        } catch { /* Intl not available */ }
        return result;
    }, [dynamicCountryCoords]);

    const maxNodes = Math.max(...Object.values(activeDistribution), 1);

    const dataPoints = useMemo(() => {
        return Object.entries(activeDistribution)
            .map(([country, count]) => {
                // Normalize: country may be ISO-2 ("FR") or full name ("France") — handle both
                const isoKey = displayNameToIso[country] ?? country;
                const coords = COUNTRY_COORDS[isoKey] || dynamicCountryCoords[isoKey];
                if (!coords) return null;
                const intensity = count / maxNodes;
                return {
                    country: coords.name,
                    fullCountry: country,
                    isoCode: coords.code,
                    count,
                    lat: coords.coordinates[1],
                    lng: coords.coordinates[0],
                    intensity,
                    color: `rgba(${accentRgb}, ${0.4 + intensity * 0.6})`,
                    size: 0.04 + intensity * 0.16,
                };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);
    }, [activeDistribution, maxNodes, accentRgb, dynamicCountryCoords, displayNameToIso]);

    const connections = useMemo(() => {
        if (dataPoints.length < 2) return [];
        const top = [...dataPoints].sort((a: any, b: any) => b.count - a.count).slice(0, 12);
        const arcs: any[] = [];
        // Hub (top country) → top 2–5 (4 arcs max)
        const hubCount = Math.min(4, top.length - 1);
        for (let i = 1; i <= hubCount; i++) {
            arcs.push({
                startLat: top[0].lat, startLng: top[0].lng,
                endLat: top[i].lat, endLng: top[i].lng,
                startColor: `rgba(${accentRgb}, 0.55)`,
                endColor: 'rgba(168, 85, 247, 0.4)',
            });
        }
        // Secondary: top 2–5 each link to one country from top 6–12
        for (let i = 1; i <= hubCount; i++) {
            const secondIdx = 4 + i;
            if (secondIdx >= top.length) break;
            arcs.push({
                startLat: top[i].lat, startLng: top[i].lng,
                endLat: top[secondIdx].lat, endLng: top[secondIdx].lng,
                startColor: `rgba(${accentRgb}, 0.3)`,
                endColor: 'rgba(168, 85, 247, 0.25)',
            });
        }
        return arcs;
    }, [dataPoints, accentRgb]);

    return (
        <div className="relative flex flex-col w-full min-h-[400px]">
            <h2 className="sr-only">Geographic Distribution</h2>

            <div
                ref={containerRef}
                className="w-full h-[550px] md:h-[700px] relative flex items-center justify-center"
                style={{ background: 'transparent' }}
            >
                {dimensions.width > 0 && dimensions.height > 0 && (
                    <Globe
                        ref={globeRef}
                        width={dimensions.width}
                        height={dimensions.height} // Reverted to full container height for better control
                        backgroundColor="rgba(0,0,0,0)"
                        globeImageUrl={globeImageUrl}
                        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

                        onGlobeReady={() => {
                            if (globeRef.current) {
                                globeRef.current.pointOfView({ altitude: 1.98, lat: 25, lng: -10 }, 1500);
                                (rotationTimerRef as any).current = setTimeout(() => {
                                    if (globeRef.current) {
                                        globeRef.current.controls().autoRotate = true;
                                        globeRef.current.controls().autoRotateSpeed = 0.8;
                                    }
                                }, 1550);
                            }
                        }}
                        polygonsData={countriesGeoJson.features}
                        polygonAltitude={(d: any) => d === hoveredPolygon ? 0.015 : 0.005}
                        polygonCapColor={(d: any) => {
                            const nodeData = dataPoints.find(p => p.isoCode === d.properties.ISO_A2 || p.fullCountry === d.properties.ADMIN || p.country === d.properties.NAME || (p.isoCode === 'FR' && d.properties.NAME === 'France'));
                            if (d === hoveredPolygon) return `rgba(${accentRgb}, 0.7)`;
                            if (nodeData) {
                                // For node countries: clearly highlighted with blockchain accent color
                                return `rgba(${accentRgb}, 0.55)`;
                            }
                            // For non-node countries: transparent dark overlay to let the dark earth texture show
                            return `rgba(0, 0, 0, 0.45)`;
                        }}
                        polygonSideColor={() => `rgba(${accentRgb}, 0.05)`}
                        polygonStrokeColor={(d: any) => {
                            const nodeData = dataPoints.find(p => p.isoCode === d.properties.ISO_A2 || p.fullCountry === d.properties.ADMIN || p.country === d.properties.NAME || (p.isoCode === 'FR' && d.properties.NAME === 'France'));
                            if (d === hoveredPolygon) return `rgba(${accentRgb}, 1)`;
                            if (nodeData) return `rgba(${accentRgb}, 0.6)`;
                            // Subtle light stroke for country boundaries
                            return `rgba(255, 255, 255, 0.08)`;
                        }}
                        onPolygonHover={setHoveredPolygon}
                        polygonLabel={(d: any) => {
                            const nodeData = dataPoints.find(p => p.isoCode === d.properties.ISO_A2 || p.fullCountry === d.properties.ADMIN || p.country === d.properties.NAME || (p.isoCode === 'FR' && d.properties.NAME === 'France'));
                            if (!nodeData) return '';
                            return `<div style="background:linear-gradient(135deg,rgba(${accentRgb},0.95),rgba(168,85,247,0.9));backdrop-filter:blur(12px);padding:10px 16px;border-radius:8px;border:1px solid rgba(${accentRgb},0.5);box-shadow:0 10px 25px rgba(0,0,0,0.3);color:white;font-family:inherit;"><p style="font-size:11px;font-weight:700;margin:0 0 4px 0;opacity:0.9;letter-spacing:0.05em;text-align:center;text-transform:uppercase;">${nodeData.country}</p><p style="font-size:16px;font-weight:900;margin:0;text-align:center;">${nodeData.count} <span style="font-size:11px;font-weight:400;opacity:0.8;">${nodeData.count === 1 ? 'Node' : 'Nodes'}</span></p></div>`;
                        }}

                        pointsData={dataPoints}
                        pointLat="lat"
                        pointLng="lng"
                        pointColor="color"
                        pointAltitude="size"
                        pointRadius={0.35}
                        pointsMerge={false}
                        pointLabel={(d: any) => `<div style="background:rgba(10,10,30,0.92);padding:8px 14px;border-radius:8px;border:1px solid rgba(${accentRgb},0.5);color:white;font-family:inherit;text-align:center;"><p style="font-size:11px;font-weight:700;margin:0 0 3px 0;text-transform:uppercase;letter-spacing:0.05em;">${d.country}</p><p style="font-size:15px;font-weight:900;margin:0;">${d.count} <span style="font-size:10px;font-weight:400;opacity:0.8;">nodes</span></p></div>`}
                        onPointClick={(point: any) => onCountryClick?.(point.isoCode)}

                        arcsData={connections}
                        arcStartLat="startLat"
                        arcStartLng="startLng"
                        arcEndLat="endLat"
                        arcEndLng="endLng"
                        arcColor={(d: any) => [d.startColor, d.endColor]}
                        arcStroke={0.38}
                        arcDashLength={0.4}
                        arcDashGap={0.2}
                        arcDashAnimateTime={2500}
                        arcAltitudeAutoScale={0.4}

                        atmosphereColor={accent}
                        atmosphereAltitude={0.12}
                    />
                )}
            </div>

            {/* Legend overlay */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 lg:right-12 flex flex-col items-end gap-2.5 z-20 pointer-events-none">

                {/* Active Node + Heatmap */}
                <div className="flex items-center gap-4 px-4 py-2 rounded-full backdrop-blur-md shadow-lg border pointer-events-auto bg-[#050510]/80 border-white/10">
                    <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                        <span className="font-medium text-[10px] tracking-widest uppercase text-slate-300">Active Node</span>
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full animate-ping opacity-60" style={{ backgroundColor: accent }} />
                            <div className="absolute inset-0 w-2 h-2 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Low</span>
                        <div className="w-16 h-1 rounded-full" style={{ background: `linear-gradient(to right, rgba(${accentRgb}, 0.2), rgba(${accentRgb}, 0.6), rgba(${accentRgb}, 1))`, boxShadow: `0 0 5px rgba(${accentRgb}, 0.5)` }} />
                        <span className="text-[9px] uppercase font-bold tracking-wider text-white/90">High</span>
                    </div>
                </div>

                {/* Row for Countries and basic stats */}
                <div className="flex flex-col items-end gap-2">
                    {/* Countries count */}
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border pointer-events-auto bg-[#050510]/80 border-white/10">
                        <span className="font-medium text-[10px] tracking-widest uppercase text-slate-300">Countries</span>
                        <div className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-md" style={{ background: `rgba(${accentRgb}, 0.15)`, border: `1px solid rgba(${accentRgb}, 0.3)` }}>
                            <span className="text-[10px] font-bold leading-none text-[var(--chain-accent)]">{Object.keys(activeDistribution).length}</span>
                        </div>
                    </div>

                    {/* Additional KPI pills - Discrete format with Tooltips */}
                    {totalNodes !== undefined && (
                        <div className="relative pointer-events-auto">
                            <div 
                                onClick={() => setActiveTooltip(activeTooltip === 'total' ? null : 'total')}
                                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border cursor-pointer hover:scale-105 transition-transform bg-[#050510]/80 border-white/10 hover:border-white/30"
                            >
                                <span className="font-medium text-[10px] tracking-widest uppercase text-slate-300">Network Tot.</span>
                                <span className="text-[10px] font-bold text-[var(--chain-accent)]">{totalNodes.toLocaleString()}</span>
                            </div>
                            
                            <AnimatePresence>
                                {activeTooltip === 'total' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                        className="absolute right-full mr-4 top-0 z-50 w-64 bg-[#050510]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl text-left shadow-[var(--chain-accent)]/20"
                                    >
                                        <button className="absolute top-2 right-2 text-white/30 hover:text-white" onClick={() => setActiveTooltip(null)}>
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <h4 className="text-xs font-bold mb-1.5 flex items-center gap-1.5 text-[var(--chain-accent)]">
                                            <ServerIcon className="w-3.5 h-3.5" />
                                            {theme === 'ethereum' ? 'Total Execution Nodes' : theme === 'avalanche' ? 'Total Network Peers' : 'Total Network Nodes'}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            {theme === 'ethereum' 
                                                ? 'Total number of discovered execution-layer nodes across the entire Ethereum network during the last crawl.'
                                                : theme === 'avalanche'
                                                ? 'Total number of active peers detected globally on the Avalanche network.'
                                                : 'Total number of active nodes detected globally on the network.'}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {ovhNodes !== undefined && (
                        <div className="relative pointer-events-auto">
                            <div 
                                onClick={() => setActiveTooltip(activeTooltip === 'ovh' ? null : 'ovh')}
                                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border cursor-pointer hover:scale-105 transition-transform bg-[#050510]/80 border-white/10 hover:border-white/30"
                            >
                                <span className={`font-medium text-[10px] tracking-widest uppercase text-slate-300`}>OVH Nodes</span>
                                <span className="text-[10px] font-bold text-[var(--chain-accent)]">{ovhNodes.toLocaleString()}</span>
                            </div>

                            <AnimatePresence>
                                {activeTooltip === 'ovh' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                        className="absolute right-full mr-4 top-0 z-50 w-64 bg-[#050510]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl text-left shadow-[var(--chain-accent)]/20"
                                    >
                                        <button className="absolute top-2 right-2 text-white/30 hover:text-white" onClick={() => setActiveTooltip(null)}>
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <h4 className="text-xs font-bold mb-1.5 flex items-center gap-1.5 text-[var(--chain-accent)]">
                                            <ServerIcon className="w-3.5 h-3.5" />
                                            {theme === 'ethereum' ? 'Active OVH Nodes' : theme === 'avalanche' ? 'Active OVH Peers' : 'Active OVH Nodes (RPC + Staking)'}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            {theme === 'ethereum' 
                                                ? 'Number of Ethereum execution-layer nodes mapped to OVHcloud ASNs via MaxMind GeoLite2.'
                                                : theme === 'avalanche' 
                                                ? 'Number of Avalanche network peers mapped to OVHcloud infrastructure via GeoLite2.'
                                                : 'Total number of Solana network nodes (both RPC and voting validators) currently identifying as hosting on OVHcloud infrastructure via their ASN.'}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {marketShare !== undefined && (
                        <div className="relative pointer-events-auto">
                            <div 
                                onClick={() => setActiveTooltip(activeTooltip === 'market' ? null : 'market')}
                                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border cursor-pointer hover:scale-105 transition-transform bg-[#050510]/80 border-white/10 hover:border-white/30"
                            >
                                <span className={`font-medium text-[10px] tracking-widest uppercase text-slate-300`}>Market</span>
                                <span className="text-[10px] font-bold text-[var(--chain-accent)]">{(marketShare).toFixed(2)}%</span>
                            </div>

                            <AnimatePresence>
                                {activeTooltip === 'market' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                        className="absolute right-full mr-4 top-0 z-50 w-64 bg-[#050510]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl text-left shadow-[var(--chain-accent)]/20"
                                    >
                                        <button className="absolute top-2 right-2 text-white/30 hover:text-white" onClick={() => setActiveTooltip(null)}>
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <h4 className="text-xs font-bold mb-1.5 flex items-center gap-1.5 text-[var(--chain-accent)]">
                                            <ChartPieIcon className="w-3.5 h-3.5" />
                                            Node Market Share
                                        </h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            {theme === 'ethereum' 
                                                ? 'Percentage of total Ethereum execution-layer nodes hosted on OVHcloud infrastructure.'
                                                : theme === 'avalanche' 
                                                ? 'Percentage of total Avalanche peers hosted on OVHcloud infrastructure.'
                                                : 'Percentage of total network nodes (RPC + Staking) hosted on OVH.'}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* OVH / GLOBAL toggle */}
                {globalGeoDistribution && (
                    <div className="flex items-center p-1.5 rounded-full backdrop-blur-2xl shadow-2xl border pointer-events-auto bg-[#050510]/90 border-white/20">
                        <button
                            onClick={theme === 'ethereum' ? undefined : () => setViewMode('ovh')}
                            disabled={theme === 'ethereum'}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${theme === 'ethereum' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            style={viewMode === 'ovh' ? {
                                background: `rgba(${accentRgb}, 0.3)`,
                                color: '#FFFFFF',
                                boxShadow: `0 0 15px rgba(${accentRgb}, 0.5)`,
                            } : { color: '#9ca3af' }}
                        >
                            {theme === 'ethereum' ? 'Available soon' : 'OVHcloud'}
                        </button>
                        <button
                            onClick={() => setViewMode('global')}
                            className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300"
                            style={viewMode === 'global' ? {
                                background: `rgba(${accentRgb}, 0.35)`,
                                color: '#FFFFFF',
                                boxShadow: `0 0 15px rgba(${accentRgb}, 0.5)`,
                            } : { color: '#9ca3af' }}
                        >
                            Global
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

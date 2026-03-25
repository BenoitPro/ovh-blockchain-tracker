'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { ServerIcon, ChartPieIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

const COUNTRY_COORDS: Record<string, { coordinates: [number, number]; name: string; code: string }> = {
    'France': { coordinates: [2.2137, 46.2276], name: 'France', code: 'FR' },
    'Germany': { coordinates: [10.4515, 51.1657], name: 'Germany', code: 'DE' },
    'United Kingdom': { coordinates: [-3.4360, 55.3781], name: 'UK', code: 'GB' },
    'Netherlands': { coordinates: [5.2913, 52.1326], name: 'Netherlands', code: 'NL' },
    'Spain': { coordinates: [-3.7492, 40.4637], name: 'Spain', code: 'ES' },
    'Italy': { coordinates: [12.5674, 41.8719], name: 'Italy', code: 'IT' },
    'Poland': { coordinates: [19.1451, 51.9194], name: 'Poland', code: 'PL' },
    'Sweden': { coordinates: [18.6435, 60.1282], name: 'Sweden', code: 'SE' },
    'Switzerland': { coordinates: [8.2275, 46.8182], name: 'Switzerland', code: 'CH' },
    'Belgium': { coordinates: [4.4699, 50.5039], name: 'Belgium', code: 'BE' },
    'Finland': { coordinates: [25.7482, 61.9241], name: 'Finland', code: 'FI' },
    'United States': { coordinates: [-95.7129, 37.0902], name: 'USA', code: 'US' },
    'Canada': { coordinates: [-106.3468, 56.1304], name: 'Canada', code: 'CA' },
    'Singapore': { coordinates: [103.8198, 1.3521], name: 'Singapore', code: 'SG' },
    'Japan': { coordinates: [138.2529, 36.2048], name: 'Japan', code: 'JP' },
    'China': { coordinates: [104.1954, 35.8617], name: 'China', code: 'CN' },
    'India': { coordinates: [78.9629, 20.5937], name: 'India', code: 'IN' },
    'South Korea': { coordinates: [127.7669, 35.9078], name: 'S. Korea', code: 'KR' },
    'Russia': { coordinates: [105.3188, 61.5240], name: 'Russia', code: 'RU' },
    'Australia': { coordinates: [133.7751, -25.2744], name: 'Australia', code: 'AU' },
    'Brazil': { coordinates: [-51.9253, -14.2350], name: 'Brazil', code: 'BR' },
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
    const [viewMode, setViewMode] = useState<'ovh' | 'global'>('ovh');
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [countriesGeoJson, setCountriesGeoJson] = useState<any>({ features: [] });
    const [hoveredPolygon, setHoveredPolygon] = useState<any>(null);
    const { theme } = useNetworkTheme();
    const isEth = theme === 'ethereum';
    const accent = isEth ? '#627EEA' : '#00F0FF';
    const accentRgb = isEth ? '98, 126, 234' : '0, 240, 255';
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const activeDistribution = (viewMode === 'global' && globalGeoDistribution)
        ? globalGeoDistribution
        : geoDistribution;

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(setCountriesGeoJson);
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

    const maxNodes = Math.max(...Object.values(activeDistribution), 1);

    const dataPoints = useMemo(() => {
        return Object.entries(activeDistribution)
            .map(([country, count]) => {
                const coords = COUNTRY_COORDS[country];
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
    }, [activeDistribution, maxNodes, accentRgb]);

    const connections = useMemo(() => {
        if (dataPoints.length < 2) return [];
        const mainHub = [...dataPoints].sort((a: any, b: any) => b.count - a.count)[0];
        if (!mainHub) return [];
        return dataPoints
            .filter((point: any) => point.fullCountry !== mainHub.fullCountry)
            .map((point: any) => ({
                startLat: mainHub.lat,
                startLng: mainHub.lng,
                endLat: point.lat,
                endLng: point.lng,
                color: [`rgba(${accentRgb}, 0.4)`, 'rgba(168, 85, 247, 0.6)'],
            }));
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
                        globeImageUrl={isEth
                            ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP8////PwAFBwL/XjY0ZAAAAABJRU5ErkJggg=="
                            : "//unpkg.com/three-globe/example/img/earth-dark.jpg"}
                        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

                        onGlobeReady={() => {
                            if (globeRef.current) {
                                globeRef.current.pointOfView({ altitude: 1.98, lat: 25, lng: -10 }, 1500);
                                setTimeout(() => {
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
                            if (d === hoveredPolygon) return `rgba(${accentRgb}, 0.6)`;
                            if (nodeData) {
                                // For node countries: clearly dark blue
                                return `rgba(60, 80, 180, ${isEth ? 0.6 : 0.08})`;
                            }
                            // For non-node countries: clearly darker blue than the light sea
                            return isEth ? 'rgba(98, 126, 234, 0.25)' : 'rgba(255, 255, 255, 0.0)';
                        }}
                        polygonSideColor={() => `rgba(${accentRgb}, 0.05)`}
                        polygonStrokeColor={(d: any) => {
                            const nodeData = dataPoints.find(p => p.isoCode === d.properties.ISO_A2 || p.fullCountry === d.properties.ADMIN || p.country === d.properties.NAME || (p.isoCode === 'FR' && d.properties.NAME === 'France'));
                            if (d === hoveredPolygon) return `rgba(${accentRgb}, 1)`;
                            if (nodeData) return `rgba(${accentRgb}, 0.5)`;
                            return isEth ? 'rgba(98, 126, 234, 0.15)' : 'rgba(255, 255, 255, 0.05)';
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
                        pointsMerge={true}
                        onPointClick={(point: any) => onCountryClick?.(point.isoCode)}

                        arcsData={connections}
                        arcStartLat="startLat"
                        arcStartLng="startLng"
                        arcEndLat="endLat"
                        arcEndLng="endLng"
                        arcColor="color"
                        arcDashLength={0.4}
                        arcDashGap={0.2}
                        arcDashAnimateTime={2500}
                        arcAltitudeAutoScale={0.4}

                        atmosphereColor={accent}
                        atmosphereAltitude={0.05}
                    />
                )}
            </div>

            {/* Legend overlay */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 lg:right-12 flex flex-col items-end gap-2.5 z-20 pointer-events-none">

                {/* Active Node + Heatmap */}
                <div className={`flex items-center gap-4 px-4 py-2 rounded-full backdrop-blur-md shadow-lg border pointer-events-auto ${isEth ? 'bg-[#1e2b5e]/40 border-[#627EEA]/30' : 'bg-black/40 border-white/10'}`}>
                    <div className={`flex items-center gap-2 pr-4 border-r ${isEth ? 'border-[#627EEA]/30' : 'border-white/10'}`}>
                        <span className={`font-medium text-[10px] tracking-widest uppercase ${isEth ? 'text-blue-200' : 'text-gray-300'}`}>Active Node</span>
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full animate-ping opacity-60" style={{ backgroundColor: accent }} />
                            <div className="absolute inset-0 w-2 h-2 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                        <span className={`text-[9px] uppercase font-bold tracking-wider ${isEth ? 'text-blue-300/70' : 'text-gray-500'}`}>Low</span>
                        <div className="w-16 h-1 rounded-full" style={{ background: `linear-gradient(to right, rgba(${accentRgb}, 0.2), rgba(${accentRgb}, 0.6), rgba(${accentRgb}, 1))`, boxShadow: `0 0 5px rgba(${accentRgb}, 0.5)` }} />
                        <span className={`text-[9px] uppercase font-bold tracking-wider ${isEth ? 'text-blue-100' : 'text-white/90'}`}>High</span>
                    </div>
                </div>

                {/* Row for Countries and basic stats */}
                <div className="flex flex-col items-end gap-2">
                    {/* Countries count */}
                    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border pointer-events-auto ${isEth ? 'bg-[#1e2b5e]/40 border-[#627EEA]/30' : 'bg-black/40 border-white/10'}`}>
                        <span className={`font-medium text-[10px] tracking-widest uppercase ${isEth ? 'text-blue-200' : 'text-gray-300'}`}>Countries</span>
                        <div className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-md" style={{ background: `rgba(${accentRgb}, 0.15)`, border: `1px solid rgba(${accentRgb}, 0.3)` }}>
                            <span className="text-[10px] font-bold leading-none" style={{ color: isEth ? '#94a3b8' : accent }}>{Object.keys(activeDistribution).length}</span>
                        </div>
                    </div>

                    {/* Additional KPI pills - Discrete format with Tooltips */}
                    {totalNodes !== undefined && (
                        <div className="relative pointer-events-auto">
                            <div 
                                onClick={() => setActiveTooltip(activeTooltip === 'total' ? null : 'total')}
                                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border cursor-pointer hover:scale-105 transition-transform ${isEth ? 'bg-[#1e2b5e]/40 border-[#627EEA]/30' : 'bg-black/40 border-white/10'}`}
                            >
                                <span className={`font-medium text-[10px] tracking-widest uppercase ${isEth ? 'text-blue-300/70' : 'text-gray-400'}`}>Network Tot.</span>
                                <span className="text-[10px] font-bold" style={{ color: isEth ? '#818cf8' : '#A855F7' }}>{totalNodes.toLocaleString()}</span>
                            </div>
                            
                            <AnimatePresence>
                                {activeTooltip === 'total' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                        className="absolute right-full mr-4 top-0 z-50 w-64 bg-[#050510]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl text-left"
                                        style={{ boxShadow: `0 10px 40px ${isEth ? '#818cf820' : '#A855F720'}` }}
                                    >
                                        <button className="absolute top-2 right-2 text-white/30 hover:text-white" onClick={() => setActiveTooltip(null)}>
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <h4 className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: isEth ? '#818cf8' : '#A855F7' }}>
                                            <ServerIcon className="w-3.5 h-3.5" />
                                            {isEth ? 'Total Execution Nodes' : 'Total Network Nodes'}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            {isEth 
                                                ? 'Total number of discovered execution-layer nodes across the entire Ethereum network during the last crawl.'
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
                                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border cursor-pointer hover:scale-105 transition-transform ${isEth ? 'bg-[#1e2b5e]/40 border-[#627EEA]/30' : 'bg-black/40 border-white/10'}`}
                            >
                                <span className={`font-medium text-[10px] tracking-widest uppercase ${isEth ? 'text-blue-300/70' : 'text-gray-400'}`}>OVH Nodes</span>
                                <span className="text-[10px] font-bold" style={{ color: isEth ? '#4fd1c5' : '#00F0FF' }}>{ovhNodes.toLocaleString()}</span>
                            </div>

                            <AnimatePresence>
                                {activeTooltip === 'ovh' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                        className="absolute right-full mr-4 top-0 z-50 w-64 bg-[#050510]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl text-left"
                                        style={{ boxShadow: `0 10px 40px ${isEth ? '#4fd1c520' : '#00F0FF20'}` }}
                                    >
                                        <button className="absolute top-2 right-2 text-white/30 hover:text-white" onClick={() => setActiveTooltip(null)}>
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <h4 className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: isEth ? '#4fd1c5' : '#00F0FF' }}>
                                            <ServerIcon className="w-3.5 h-3.5" />
                                            {isEth ? 'Active OVH Nodes' : 'Active OVH Nodes (RPC + Staking)'}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            {isEth 
                                                ? 'Number of Ethereum execution-layer nodes mapped to OVHcloud ASNs via MaxMind GeoLite2.'
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
                                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border cursor-pointer hover:scale-105 transition-transform ${isEth ? 'bg-[#1e2b5e]/40 border-[#627EEA]/30' : 'bg-black/40 border-white/10'}`}
                            >
                                <span className={`font-medium text-[10px] tracking-widest uppercase ${isEth ? 'text-blue-300/70' : 'text-gray-400'}`}>Market</span>
                                <span className="text-[10px] font-bold" style={{ color: isEth ? '#93c5fd' : '#1fb1ff' }}>{(marketShare).toFixed(2)}%</span>
                            </div>

                            <AnimatePresence>
                                {activeTooltip === 'market' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                        className="absolute right-full mr-4 top-0 z-50 w-64 bg-[#050510]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl text-left"
                                        style={{ boxShadow: `0 10px 40px ${isEth ? '#93c5fd20' : '#1fb1ff20'}` }}
                                    >
                                        <button className="absolute top-2 right-2 text-white/30 hover:text-white" onClick={() => setActiveTooltip(null)}>
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <h4 className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: isEth ? '#93c5fd' : '#1fb1ff' }}>
                                            <ChartPieIcon className="w-3.5 h-3.5" />
                                            Node Market Share
                                        </h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            {isEth 
                                                ? 'Percentage of total Ethereum execution-layer nodes hosted on OVHcloud infrastructure.'
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
                    <div className={`flex items-center p-1 rounded-full backdrop-blur-xl shadow-lg border pointer-events-auto ${isEth ? 'bg-[#1e2b5e]/50 border-[#627EEA]/40' : 'bg-black/50 border-white/15'}`}>
                        <button
                            onClick={() => setViewMode('ovh')}
                            className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-200"
                            style={viewMode === 'ovh' ? {
                                background: `rgba(${accentRgb}, 0.22)`,
                                color: accent,
                                boxShadow: `0 0 10px rgba(${accentRgb}, 0.3)`,
                            } : { color: isEth ? '#94a3b8' : '#6b7280' }}
                        >
                            OVHcloud
                        </button>
                        <button
                            onClick={() => setViewMode('global')}
                            className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-200"
                            style={viewMode === 'global' ? {
                                background: `rgba(${accentRgb}, 0.22)`,
                                color: accent,
                                boxShadow: `0 0 10px rgba(${accentRgb}, 0.3)`,
                            } : { color: isEth ? '#94a3b8' : '#6b7280' }}
                        >
                            Global
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

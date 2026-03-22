'use client';

import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';

interface WorldMapProps {
    geoDistribution: Record<string, number>;
    /** Called when user clicks a country dot; receives the 2-letter ISO code */
    onCountryClick?: (isoCode: string) => void;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Real GPS Coordinates [Longitude, Latitude] + ISO codes for navigation
const COUNTRY_COORDS: Record<string, { coordinates: [number, number]; name: string; code: string }> = {
    // Europe
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

    // North America
    'United States': { coordinates: [-95.7129, 37.0902], name: 'USA', code: 'US' },
    'Canada': { coordinates: [-106.3468, 56.1304], name: 'Canada', code: 'CA' },

    // Asia
    'Singapore': { coordinates: [103.8198, 1.3521], name: 'Singapore', code: 'SG' },
    'Japan': { coordinates: [138.2529, 36.2048], name: 'Japan', code: 'JP' },
    'China': { coordinates: [104.1954, 35.8617], name: 'China', code: 'CN' },
    'India': { coordinates: [78.9629, 20.5937], name: 'India', code: 'IN' },
    'South Korea': { coordinates: [127.7669, 35.9078], name: 'S. Korea', code: 'KR' },
    'Russia': { coordinates: [105.3188, 61.5240], name: 'Russia', code: 'RU' },

    // Oceania
    'Australia': { coordinates: [133.7751, -25.2744], name: 'Australia', code: 'AU' },

    // South America
    'Brazil': { coordinates: [-51.9253, -14.2350], name: 'Brazil', code: 'BR' },
};

export default function WorldMap({ geoDistribution, onCountryClick }: WorldMapProps) {
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

    // Calculer le nombre maximum de nœuds pour l'échelle
    const maxNodes = Math.max(...Object.values(geoDistribution), 1); // fallback à 1 pour éviter div/0

    // Préparer les points de données
    const dataPoints = useMemo(() => {
        return Object.entries(geoDistribution)
            .map(([country, count]) => {
                const coords = COUNTRY_COORDS[country];
                if (!coords) {
                    console.warn(`Coordinates not found for: ${country}`);
                    return null;
                }

                const intensity = count / maxNodes;
                const baseRadius = 4;
                const radius = baseRadius + intensity * 8; 

                return {
                    country: coords.name,
                    fullCountry: country,
                    isoCode: coords.code,
                    count,
                    coordinates: coords.coordinates,
                    radius,
                    intensity,
                };
            })
            .filter(Boolean) as Array<{
                country: string;
                fullCountry: string;
                isoCode: string;
                count: number;
                coordinates: [number, number];
                radius: number;
                intensity: number;
            }>;
    }, [geoDistribution, maxNodes]);

    // Générer des connexions (simuler un réseau blockchain)
    // On connecte le point avec le plus grand nombre de nœuds (Hub principal, ex: France/US) aux autres.
    const connections = useMemo(() => {
        if (dataPoints.length < 2) return [];
        
        // Trouver le plus gros hub
        const mainHub = [...dataPoints].sort((a, b) => b.count - a.count)[0];
        
        return dataPoints
            .filter(point => point.fullCountry !== mainHub.fullCountry)
            .map(point => ({
                from: mainHub.coordinates,
                to: point.coordinates,
            }));
    }, [dataPoints]);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-8 glass-card">
            <h2 className="text-xl font-bold text-white mb-6">Geographic Distribution</h2>

            {/* Carte du monde vectorielle */}
            <div className="relative w-full aspect-[2/1] bg-gradient-to-br from-[#060a14] via-[#0a0e1a] to-[#060a14] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                
                <ComposableMap
                    projection="geoEqualEarth"
                    projectionConfig={{
                         scale: 160,
                         center: [0, 0]
                    }}
                    style={{ width: "100%", height: "100%", outline: "none" }}
                >
                    {/* Les pays / The map itself */}
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="rgba(255, 255, 255, 0.05)"
                                    stroke="rgba(0, 240, 255, 0.15)"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none", transition: "all 0.3s ease", },
                                        hover: { fill: "rgba(0, 240, 255, 0.1)", outline: "none", stroke: "rgba(0, 240, 255, 0.4)" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Lignes de connexion réseau */}
                    {connections.map((conn, i) => (
                        <Line
                            key={`line-${i}`}
                            from={conn.from}
                            to={conn.to}
                            stroke="rgba(0, 240, 255, 0.3)"
                            strokeWidth={1}
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: "4 4",
                                animation: "line-flow 2s linear infinite",
                            }}
                        />
                    ))}

                    {/* Points de données avec Glow effect */}
                    {dataPoints.map((point, index) => (
                        <Marker 
                            key={`marker-${index}`} 
                            coordinates={point.coordinates}
                            onMouseEnter={() => setHoveredCountry(point.fullCountry)}
                            onMouseLeave={() => setHoveredCountry(null)}
                            onClick={() => onCountryClick?.(point.isoCode)}
                            style={{
                                default: { outline: "none", cursor: onCountryClick ? "pointer" : "default" },
                                hover: { outline: "none" },
                                pressed: { outline: "none" }
                            }}
                        >
                            <circle
                                r={point.radius * 2}
                                fill="rgba(0, 240, 255, 0.2)"
                                filter="blur(6px)"
                            />
                            <circle
                                r={point.radius * 1.5}
                                fill={`rgba(0, 240, 255, ${0.4 + point.intensity * 0.4})`}
                            />
                            <circle 
                                r={point.radius * 0.6} 
                                fill="#ffffff" 
                                style={{
                                    boxShadow: '0 0 10px rgba(255, 255, 255, 1)',
                                }}
                            />
                        </Marker>
                    ))}
                </ComposableMap>

                {/* Tooltip superposé (géré en absolu sur la balise div au-dessus du composant) */}
                {hoveredCountry && (
                    <div 
                        className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
                    >
                        {dataPoints.filter(p => p.fullCountry === hoveredCountry).map((point, i) => (
                             <div 
                                key={`tooltip-${i}`}
                                className="absolute bg-gradient-to-br from-[#00F0FF]/95 to-[#A855F7]/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-[#00F0FF]/50 shadow-2xl animate-in fade-in zoom-in duration-200"
                                style={{
                                     // Positionné globalement au centre mais ça pourrait être suivi à la souris.
                                     // Pour l'instant on centre au milieu de la map avec une indication forte de la sélection
                                }}
                            >
                                <p className="text-xs font-bold text-white/90 mb-0.5 tracking-wide">
                                    {point.country}
                                </p>
                                <p className="text-base font-extrabold text-white text-center">
                                    {point.count} {point.count === 1 ? 'node' : 'nodes'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                

                {/* Effet de vignette sur les bords */}
                <div className="absolute inset-0 rounded-xl shadow-inner pointer-events-none"
                    style={{
                        boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.5)'
                    }}
                />
            </div>

            {/* Légende et statistiques - responsive */}
            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
                <div className="flex items-center justify-center sm:justify-start gap-4 md:gap-6">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-[#00F0FF]/20 to-[#00F0FF]/5 border border-[#00F0FF]/20">
                            <p className="text-xs md:text-sm font-bold text-[#00F0FF]">
                                {Object.keys(geoDistribution).length}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Countries</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
                            <p className="text-xs md:text-sm font-bold text-white">
                                {Object.values(geoDistribution).reduce((a, b) => a + b, 0)}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Total Nodes</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-[#00F0FF] shadow-lg shadow-[#00F0FF]/50"></div>
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#00F0FF] animate-ping opacity-50"></div>
                        </div>
                        <span className="text-gray-300 font-medium">Active Node</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#00F0FF]/40 shadow-sm shadow-[#00F0FF]/30"></div>
                            <span className="text-gray-400 text-xs">Low</span>
                        </div>
                        <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#00F0FF]/40 via-[#00F0FF]/70 to-[#00F0FF] shadow-sm shadow-[#00F0FF]/30"></div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#00F0FF] shadow-lg shadow-[#00F0FF]/60"></div>
                            <span className="text-gray-400 text-xs">High</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



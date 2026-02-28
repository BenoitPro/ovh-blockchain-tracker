'use client';

import { useMemo } from 'react';
import Image from 'next/image';

interface WorldMapProps {
    geoDistribution: Record<string, number>;
    /** Called when user clicks a country dot; receives the 2-letter ISO code */
    onCountryClick?: (isoCode: string) => void;
}

// Country coordinates + ISO codes for navigation
const COUNTRY_COORDS: Record<string, { x: number; y: number; name: string; code: string }> = {
    // Europe
    'France': { x: 49, y: 42, name: 'France', code: 'FR' },
    'Germany': { x: 51, y: 38, name: 'Germany', code: 'DE' },
    'United Kingdom': { x: 47, y: 37, name: 'UK', code: 'GB' },
    'Netherlands': { x: 50, y: 37, name: 'Netherlands', code: 'NL' },
    'Spain': { x: 46, y: 44, name: 'Spain', code: 'ES' },
    'Italy': { x: 52, y: 44, name: 'Italy', code: 'IT' },
    'Poland': { x: 54, y: 37, name: 'Poland', code: 'PL' },
    'Sweden': { x: 53, y: 30, name: 'Sweden', code: 'SE' },
    'Switzerland': { x: 50, y: 41, name: 'Switzerland', code: 'CH' },
    'Belgium': { x: 49.5, y: 38, name: 'Belgium', code: 'BE' },
    'Finland': { x: 58, y: 25, name: 'Finland', code: 'FI' },

    // North America
    'United States': { x: 22, y: 44, name: 'USA', code: 'US' },
    'Canada': { x: 20, y: 32, name: 'Canada', code: 'CA' },

    // Asia
    'Singapore': { x: 76, y: 54, name: 'Singapore', code: 'SG' },
    'Japan': { x: 87, y: 41, name: 'Japan', code: 'JP' },
    'China': { x: 77, y: 40, name: 'China', code: 'CN' },
    'India': { x: 68, y: 48, name: 'India', code: 'IN' },
    'South Korea': { x: 84, y: 40, name: 'S. Korea', code: 'KR' },
    'Russia': { x: 65, y: 28, name: 'Russia', code: 'RU' },

    // Oceania
    'Australia': { x: 85, y: 72, name: 'Australia', code: 'AU' },

    // South America
    'Brazil': { x: 30, y: 62, name: 'Brazil', code: 'BR' },
};

export default function WorldMap({ geoDistribution, onCountryClick }: WorldMapProps) {
    // Calculer le nombre maximum de nœuds pour l'échelle
    const maxNodes = Math.max(...Object.values(geoDistribution));

    // Préparer les points de données
    const dataPoints = useMemo(() => {
        return Object.entries(geoDistribution)
            .map(([country, count]) => {
                const coords = COUNTRY_COORDS[country];
                if (!coords) {
                    console.warn(`Coordonnées non trouvées pour: ${country}`);
                    return null;
                }

                const intensity = count / maxNodes;
                // Réduction de 40% de la taille des points pour meilleure lisibilité
                const baseRadius = 6; // Réduit de 10 à 6
                const radius = baseRadius + intensity * 11; // Réduit de 18 à 11

                return {
                    country: coords.name,
                    fullCountry: country,
                    isoCode: coords.code,
                    count,
                    x: coords.x,
                    y: coords.y,
                    radius,
                    intensity,
                };
            })
            .filter(Boolean) as Array<{
                country: string;
                fullCountry: string;
                isoCode: string;
                count: number;
                x: number;
                y: number;
                radius: number;
                intensity: number;
            }>;
    }, [geoDistribution, maxNodes]);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-8 glass-card">
            <h2 className="text-xl font-bold text-white mb-6">Geographic Distribution</h2>

            {/* Carte du monde avec points de chaleur */}
            <div className="relative w-full aspect-[2/1] bg-gradient-to-br from-[#0a0e1a] via-[#0d1220] to-[#0a0e1a] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                {/* Image de la carte du monde en pointillés */}
                <div className="absolute inset-0">
                    <Image
                        src="/world-map-wide.png"
                        alt="World Map"
                        fill
                        className="object-cover"
                        style={{
                            opacity: 0.4,
                            filter: 'invert(1) brightness(0.7) hue-rotate(180deg)',
                            objectPosition: 'center center',
                        }}
                        priority
                    />
                </div>

                {/* Points de chaleur */}
                <div className="absolute inset-0">
                    {dataPoints.map((point, index) => (
                        <div
                            key={index}
                            className="absolute group"
                            style={{
                                left: `${point.x}%`,
                                top: `${point.y}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            {/* Halo de lueur statique (pas d'animation) */}
                            <div
                                className="absolute rounded-full blur-xl"
                                style={{
                                    width: `${point.radius * 3}px`,
                                    height: `${point.radius * 3}px`,
                                    background: `radial-gradient(circle, 
                                        rgba(0, 240, 255, ${0.4 + point.intensity * 0.2}) 0%, 
                                        transparent 70%)`,
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />

                            {/* Cercle principal statique */}
                            <div
                                className="relative rounded-full transition-transform duration-200 hover:scale-110"
                                style={{
                                    width: `${point.radius * 2}px`,
                                    height: `${point.radius * 2}px`,
                                    background: `radial-gradient(circle at 30% 30%, 
                                        rgba(255, 255, 255, 0.9) 0%, 
                                        rgba(0, 240, 255, 0.95) 20%, 
                                        rgba(0, 240, 255, 0.8) 100%)`,
                                    boxShadow: `
                                        0 0 ${point.radius * 1.5}px rgba(0, 240, 255, 0.8),
                                        0 0 ${point.radius * 2.5}px rgba(0, 240, 255, 0.4)
                                    `,
                                    cursor: onCountryClick ? 'pointer' : 'default',
                                }}
                                onClick={() => onCountryClick?.(point.isoCode)}
                            >
                                {/* Point central lumineux */}
                                <div
                                    className="absolute rounded-full bg-white"
                                    style={{
                                        width: `${point.radius * 0.5}px`,
                                        height: `${point.radius * 0.5}px`,
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        boxShadow: '0 0 8px rgba(255, 255, 255, 1)',
                                    }}
                                />
                            </div>

                            {/* Tooltip avec info */}
                            <div
                                className="absolute whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    left: '50%',
                                    top: `${-point.radius - 28}px`,
                                    transform: 'translateX(-50%)',
                                    zIndex: 10,
                                }}
                            >
                                <div className="relative">
                                    {/* Flèche vers le bas */}
                                    <div
                                        className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-[#00F0FF]/90 rotate-45 border-r border-b border-[#00F0FF]"
                                    />

                                    {/* Contenu du tooltip */}
                                    <div className="bg-gradient-to-br from-[#00F0FF]/95 to-[#A855F7]/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-[#00F0FF]/50 shadow-2xl">
                                        <p className="text-xs font-bold text-white/90 mb-0.5 tracking-wide">
                                            {point.country}
                                        </p>
                                        <p className="text-base font-extrabold text-white text-center">
                                            {point.count} {point.count === 1 ? 'node' : 'nodes'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Ligne de connexion verticale subtile */}
                            <div
                                className="absolute bg-gradient-to-b from-[#00F0FF]/40 via-[#00F0FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    width: '1px',
                                    height: `${point.radius + 20}px`,
                                    left: '50%',
                                    top: `${-point.radius - 20}px`,
                                    transform: 'translateX(-50%)',
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Effet de vignette sur les bords */}
                <div className="absolute inset-0 rounded-xl shadow-inner pointer-events-none"
                    style={{
                        boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.5)'
                    }}
                />
            </div>

            {/* Légende et statistiques - responsive */}
            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
                {/* Statistiques à gauche */}
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

                {/* Légende à droite - masquée sur mobile */}
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

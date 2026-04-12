'use client';

import { useState } from 'react';
import { MapPinIcon, ServerIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { EnrichedNode } from '@/types';
import NodeDetails from '../nodes/NodeDetails';

interface ValidatorsListProps {
    validators: EnrichedNode[];
}

export default function ValidatorsList({ validators = [] }: ValidatorsListProps) {
    const [selectedNode, setSelectedNode] = useState<EnrichedNode | null>(null);

    const handleExportCSV = () => {
        const a = document.createElement('a');
        a.href = '/api/export';
        a.download = '';
        a.click();
    };

    if (!validators || validators.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Top OVH Validators</h2>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ color: 'var(--chain-accent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--chain-accent) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--chain-accent) 10%, transparent)' }}
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
                <p className="text-gray-400 text-center py-8">No OVH validators found in this sample</p>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-6 md:p-8 flex flex-col max-h-[800px] min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 flex-shrink-0 gap-4">
                <h2 className="text-lg md:text-xl font-bold text-white">
                    Top OVH Validators
                    <span className="ml-2 text-sm font-normal text-gray-400">
                        ({validators.length} found)
                    </span>
                </h2>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    title="Download list as CSV"
                    style={{ color: 'var(--chain-accent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--chain-accent) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--chain-accent) 10%, transparent)' }}
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {validators.map((validator, index) => (
                    <div
                        key={validator.pubkey}
                        onClick={() => setSelectedNode(validator)}
                        className="group relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/5 transition-all duration-300 hover:bg-white/[0.05] cursor-pointer"
                    >
                        <div className="p-3 md:p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
                                {/* Left: Identity */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3">
                                        <span className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold" style={{ backgroundColor: 'color-mix(in srgb, var(--chain-accent) 10%, transparent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--chain-accent) 30%, transparent)', color: 'var(--chain-accent)' }}>
                                            {index + 1}
                                        </span>

                                        {/* Validator Icon/Avatar */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                            {validator.image ? (
                                                <img src={validator.image} alt={validator.name || ''} width={32} height={32} className="w-full h-full object-cover" />
                                            ) : (
                                                <ServerIcon className="w-4 h-4 text-white/30" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                                                {validator.name || 'Unknown Validator'}
                                            </p>
                                            <code className="text-xs text-gray-400 font-mono truncate block">
                                                {validator.pubkey.slice(0, 8)}...{validator.pubkey.slice(-8)}
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Location */}
                                <div className="flex items-center space-x-2 text-xs md:text-sm ml-8 md:ml-4">
                                    <MapPinIcon className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--chain-accent)' }} />
                                    <span className="text-gray-300 whitespace-nowrap hidden sm:inline">
                                        {validator.city || 'Unknown City'}, {validator.countryName || 'Unknown Country'}
                                    </span>
                                    {/* Mobile only country code */}
                                    <span className="text-gray-300 whitespace-nowrap sm:hidden">
                                        {validator.country}
                                    </span>
                                    <span className="hidden lg:inline-block ml-2 px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-medium">
                                        {validator.provider || validator.asn}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Hover effect line */}
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundImage: 'linear-gradient(to right, transparent, var(--chain-accent), transparent)' }}></div>
                    </div>
                ))}
            </div>

            {/* Node Details Modal/Slide-over */}
            {selectedNode && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(null);
                        }}
                    ></div>

                    {/* Drawer */}
                    <div className="relative w-full max-w-2xl h-full bg-[#050510] border-l border-white/10 shadow-2xl overflow-y-auto transform transition-transform animate-slide-in-right">
                        <button
                            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors z-10"
                            onClick={() => setSelectedNode(null)}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <NodeDetails node={selectedNode} />
                    </div>
                </div>
            )}
        </div>
    );
}

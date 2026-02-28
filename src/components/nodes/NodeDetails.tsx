'use client';

import { useState, useEffect } from 'react';
import { EnrichedNode, IPInfo } from '@/types';
import {
    FingerPrintIcon,
    GlobeAmericasIcon,
    LinkIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    IdentificationIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    BanknotesIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';

interface NodeDetailsProps {
    node: EnrichedNode;
}

export default function NodeDetails({ node }: NodeDetailsProps) {
    const [fullInfo, setFullInfo] = useState<IPInfo | null>(null);
    const [loadingGeo, setLoadingGeo] = useState(false);

    // Format Lambda to SOL (Duplicate utility, could be shared)
    const formatLamports = (lamports?: number) => {
        if (!lamports) return '0 SOL';
        const sol = lamports / 1_000_000_000;
        return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(sol) + ' SOL';
    };

    useEffect(() => {
        const fetchFullInfo = async () => {
            // Reset info when node changes
            setFullInfo(null);

            if (!node.ip) return;

            setLoadingGeo(true);
            try {
                const response = await fetch(`/api/node/${node.ip}`);
                const data = await response.json();
                if (data.success) {
                    setFullInfo(data.data);
                }
            } catch (error) {
                console.error('Error fetching full node info:', error);
            } finally {
                setLoadingGeo(false);
            }
        };

        fetchFullInfo();
    }, [node]);

    const InfoCard = ({ icon: Icon, label, value, subValue, loading }: any) => (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/[0.07] group">
            <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#00F0FF]/10 text-[#00F0FF] rounded-xl group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-grow">
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">{label}</p>
                    {loading ? (
                        <div className="h-5 w-24 bg-white/10 rounded animate-pulse mt-1"></div>
                    ) : (
                        <p className="text-white font-mono break-all leading-tight">{value || 'N/A'}</p>
                    )}
                    {subValue && !loading && <p className="text-xs text-[#00F0FF]/60 mt-2 font-medium">{subValue}</p>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-8 border-b border-white/10 bg-gradient-to-r from-[#00F0FF]/5 to-transparent">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                            <ShieldCheckIcon className="h-5 w-5 text-[#00F0FF]" />
                            <span className="text-[#00F0FF] text-xs font-bold uppercase tracking-[0.2em]">
                                {node.name
                                    ? 'Validated Node'
                                    : (node.provider || node.org ? 'Provider Node' : 'Unknown Validator')}
                            </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white truncate font-mono">
                            {node.name || node.provider || node.org || node.pubkey}
                        </h3>
                        {/* Show pubkey underneath if name/provider is shown */}
                        {(node.name || node.provider || node.org) && (
                            <p className="text-sm font-mono text-white/50 mt-1 truncate">
                                {node.pubkey}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Staking Section (New) */}
                    <div className="md:col-span-2">
                        <h4 className="flex items-center space-x-2 text-white/60 font-medium mb-4">
                            <BanknotesIcon className="h-5 w-5" />
                            <span>Staking & Performance</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoCard
                                icon={BanknotesIcon}
                                label="Active Stake"
                                value={formatLamports(node.activatedStake)}
                                subValue={node.activatedStake ? 'Lamports' : 'No active stake'}
                            />
                            <InfoCard
                                icon={MegaphoneIcon}
                                label="Vote Account"
                                value={node.votePubkey || 'None'}
                                subValue={`Commission: ${node.commission ?? 'N/A'}%`}
                            />
                        </div>
                    </div>

                    {/* Identity Section */}
                    <div className="md:col-span-2 mt-4">
                        <h4 className="flex items-center space-x-2 text-white/60 font-medium mb-4">
                            <IdentificationIcon className="h-5 w-5" />
                            <span>Blockchain Identity</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoCard
                                icon={FingerPrintIcon}
                                label="Public Key"
                                value={node.pubkey}
                            />
                            <InfoCard
                                icon={LinkIcon}
                                label="Protocol Version"
                                value={node.version || 'Unknown'}
                            />
                        </div>
                    </div>

                    {/* Infrastructure Section */}
                    <div className="md:col-span-2 mt-4">
                        <h4 className="flex items-center space-x-2 text-white/60 font-medium mb-4">
                            <BuildingOfficeIcon className="h-5 w-5" />
                            <span>Infrastructure & Provider</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoCard
                                icon={BuildingOfficeIcon}
                                label="Provider / ASN"
                                value={node.org || 'Unknown'}
                                subValue={node.asn || 'AS...'}
                            />
                            <InfoCard
                                icon={GlobeAmericasIcon}
                                label="IP Address"
                                value={node.ip || 'N/A'}
                                subValue={node.ip ? 'Public IPv4' : 'Gossip Identity'}
                            />
                        </div>
                    </div>

                    {/* Geolocation Section */}
                    {node.ip && (
                        <div className="md:col-span-2 mt-4">
                            <h4 className="flex items-center space-x-2 text-white/60 font-medium mb-4">
                                <MapPinIcon className="h-5 w-5" />
                                <span>Geographical Sheet</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InfoCard
                                    icon={MapPinIcon}
                                    label="City"
                                    value={fullInfo?.city}
                                    loading={loadingGeo}
                                />
                                <InfoCard
                                    icon={GlobeAmericasIcon}
                                    label="Country"
                                    value={fullInfo?.country_name}
                                    subValue={fullInfo?.country}
                                    loading={loadingGeo}
                                />
                                <InfoCard
                                    icon={GlobeAmericasIcon}
                                    label="Coordinates"
                                    value={fullInfo ? `${fullInfo.latitude.toFixed(4)}, ${fullInfo.longitude.toFixed(4)}` : undefined}
                                    loading={loadingGeo}
                                />
                            </div>
                        </div>
                    )}

                    {/* Network Endpoints */}
                    <div className="md:col-span-2 mt-4">
                        <h4 className="flex items-center space-x-2 text-white/60 font-medium mb-4 text-sm uppercase tracking-widest">
                            Network Endpoints
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Gossip</p>
                                <p className="text-xs font-mono text-white/70">{node.gossip || 'None'}</p>
                            </div>
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">TPU</p>
                                <p className="text-xs font-mono text-white/70">{node.tpu || 'None'}</p>
                            </div>
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">RPC</p>
                                <p className="text-xs font-mono text-white/70">{node.rpc || 'None'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-8 border-t border-white/5 bg-black/40">
                <a
                    href={`https://solana.fm/address/${node.pubkey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-medium transition-all group"
                >
                    <LinkIcon className="h-5 w-5 group-hover:text-[#00F0FF] transition-colors" />
                    <span>View on SolanaExplorer</span>
                </a>
            </div>
        </div>
    );
}

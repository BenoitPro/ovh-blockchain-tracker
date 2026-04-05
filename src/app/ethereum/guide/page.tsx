'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDownIcon, 
    BookOpenIcon, 
    CpuChipIcon, 
    ServerIcon, 
    ShieldCheckIcon, 
    ArrowTopRightOnSquareIcon,
    ArrowDownTrayIcon,
    DocumentTextIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import ParticlesBackground from '@/components/ParticlesBackground';

interface GuideItem {
    id: string;
    question: string;
    answer: string;
    icon: React.ElementType;
    link?: string;
    isDownload?: boolean;
    isExternal?: boolean;
}

const guideItems: GuideItem[] = [
    {
        id: 'full-blog',
        question: "Step-by-Step: Deploying your Ethereum Node",
        answer: "Full technical tutorial on the OVHcloud blog.",
        icon: ArrowTopRightOnSquareIcon,
        link: "https://blog.ovhcloud.com/running-an-ethereum-node-on-ovhcloud-public-instances/",
        isExternal: true
    },
    {
        id: 'hardware',
        question: "What are the recommended hardware prerequisites?",
        answer: "For an OVHcloud Public Cloud instance, the ideal configuration is: 2 vCores, 30 GB of RAM, and 2 TB of High-Speed Gen2 Block Storage. RAM is crucial for the execution client's cache, while the 2 TB disk allows for the growth of the state (State Growth).",
        icon: CpuChipIcon
    },
    {
        id: 'storage',
        question: "How should storage be configured for Ethereum?",
        answer: "It is imperative to use high-performance SSD storage. On OVHcloud, attach a 'Block Storage High-Speed Gen2' volume to your instance. The volume should be mounted in a dedicated directory (e.g., /data/ethereum) to isolate the data from the operating system and facilitate snapshots.",
        icon: ServerIcon
    },
    {
        id: 'setup-guide',
        question: "How to begin the technical deployment?",
        answer: "Start by provisioning an Ubuntu 22.04 LTS instance. Install Docker for simplicity, or compile the binaries (Geth, Nethermind)... The official guide provides detailed commands to sync your node in Snapshot mode, allowing you to be operational in less than 24 hours.",
        icon: BookOpenIcon,
        link: "https://blog.ovhcloud.com/running-an-ethereum-node-on-ovhcloud-public-instances/",
    },
    {
        id: 'partners-blog',
        question: "Enterprise Solutions: Join our Web3 Partner Network",
        answer: "Connect with our specialized technical partners to scale your institutional projects.",
        icon: UserGroupIcon,
        link: "https://blog.ovhcloud.com/partners-ovhcloud-blockchain/",
        isExternal: true
    }
];

export default function EthereumGuidePage() {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleItem = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#050510]">
            {/* Background elements */}
            <ParticlesBackground />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 lg:py-28">
                {/* Hero section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#627EEA]/10 text-[#627EEA] text-[10px] font-bold uppercase tracking-[0.2em] mb-6 border border-[#627EEA]/20">
                        Resources & Support
                    </span>
                    <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight mb-8">
                        Ethereum Node <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#627EEA] to-[#818CF8]">Expert Guide</span>
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto font-medium leading-relaxed mb-4">
                        Everything you need to deploy, optimize, and secure your Ethereum nodes on OVHcloud's global infrastructure.
                    </p>
                </motion.div>

                {/* FAQ / Guide Items */}
                <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                    {guideItems.map((item, index) => {
                        const isLinkCard = item.isExternal;
                        
                        // Component contents for either Button or MotionDiv
                        const cardContent = (
                            <div className="w-full text-left px-8 py-7 flex items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all duration-300 ${
                                        expandedId === item.id || isLinkCard
                                        ? 'bg-[#627EEA] text-white'
                                        : 'bg-white/10 text-white/40 group-hover:bg-[#627EEA]/10 group-hover:text-[#627EEA]'
                                    }`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                            expandedId === item.id || isLinkCard ? 'text-white' : 'text-white/70 group-hover:text-white'
                                        }`}>
                                            {item.question}
                                        </h3>
                                        {isLinkCard && (
                                            <p className="text-sm text-[#627EEA] font-medium mt-1 uppercase tracking-wider">
                                                External Resource
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className={`transition-transform duration-300 ${expandedId === item.id ? 'rotate-180' : ''}`}>
                                    {isLinkCard ? (
                                        <ArrowTopRightOnSquareIcon className="w-5 h-5 text-[#627EEA] opacity-50 group-hover:opacity-100" />
                                    ) : (
                                        <ChevronDownIcon className={`w-6 h-6 ${expandedId === item.id ? 'text-[#627EEA]' : 'text-white/50'}`} />
                                    )}
                                </div>
                            </div>
                        );

                        if (isLinkCard) {
                            return (
                                <motion.a
                                    key={item.id}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="group relative rounded-3xl overflow-hidden transition-all duration-300 border bg-white/5 shadow-sm hover:shadow-2xl hover:shadow-[#627EEA]/15 border-[#627EEA]/20 hover:border-[#627EEA]/50"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#627EEA]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {cardContent}
                                </motion.a>
                            );
                        }

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className={`group rounded-3xl overflow-hidden transition-all duration-300 border ${
                                    expandedId === item.id
                                    ? 'bg-white/5 shadow-2xl shadow-[#627EEA]/10 border-[#627EEA]/30'
                                    : 'bg-white/5 backdrop-blur-md border-[#627EEA]/15 hover:border-[#627EEA]/40 hover:bg-white/10 shadow-sm hover:shadow-xl hover:shadow-[#627EEA]/5'
                                }`}
                            >
                                <button
                                    onClick={() => toggleItem(item.id)}
                                    className="w-full"
                                >
                                    {cardContent}
                                </button>

                                <AnimatePresence>
                                    {expandedId === item.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-8 pb-8 pt-0 ml-20">
                                                <div className="h-px w-full bg-white/10 mb-6" />
                                                <p className="text-white/60 leading-loose text-lg font-medium mb-8 max-w-3xl">
                                                    {item.answer}
                                                </p>
                                                
                                                {item.link && (
                                                    <a
                                                        href={item.link}
                                                        target={item.isDownload ? undefined : "_blank"}
                                                        rel={item.isDownload ? undefined : "noopener noreferrer"}
                                                        download={item.isDownload}
                                                        className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#627EEA] text-white font-bold text-sm tracking-wide transition-all duration-300 hover:bg-[#4F6DD4] hover:scale-105 hover:shadow-lg hover:shadow-[#627EEA]/30 active:scale-95"
                                                    >
                                                        {item.isDownload ? (
                                                            <>
                                                                <ArrowDownTrayIcon className="w-5 h-5" />
                                                                Download PDF Guide
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                                                View guide online
                                                            </>
                                                        )}
                                                    </a>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-20 text-center"
                >
                    <p className="text-white/50 font-medium mb-6">Need a custom solution for your node?</p>
                    <a 
                        href="/about#contact-section"
                        className="inline-flex items-center gap-2 text-[#627EEA] font-bold hover:underline underline-offset-4"
                    >
                        Contact our blockchain experts
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                </motion.div>
            </div>
        </main>
    );
}

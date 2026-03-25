'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import ParticlesBackground from '@/components/ParticlesBackground';

const teamMembers = [
    {
        name: 'Alexandre Al Ajroudi',
        role: 'Blockchain & Web3 lead France BeNeLux',
        image: '/assets/team/Alexandre.jpeg',
        linkedin: 'https://www.linkedin.com/in/alexandre-al-ajroudi-897b7890/',
    },
    {
        name: 'Benoit Baillon',
        role: 'Corporate & Regulated Blockchain Account - France',
        image: '/assets/team/Benoit.jpeg',
        linkedin: 'https://www.linkedin.com/in/benoit-baillon-6b8398114/',
    },
    {
        name: 'Omar Abi Issa',
        role: 'Blockchain & Web3 Global lead',
        image: '/assets/team/Omar.jpeg',
        linkedin: 'https://www.linkedin.com/in/omar-abi-issa-19106093/',
        isLead: true,
    },
    {
        name: 'Dorota Bilińska',
        role: 'Blockchain Lead- Spain & Southern Europe',
        image: '/assets/team/Dorota.jpeg',
        linkedin: 'https://www.linkedin.com/in/dorota-bilinska/',
    },
    {
        name: 'Camann MANGOPI',
        role: 'Blockchain Lead - Middle East Africa',
        image: '/assets/team/Camann.jpeg',
        linkedin: 'https://www.linkedin.com/in/camann-mangopi-2555b1211/',
    },
];

const TeamCard = ({ member, isEth }: { member: any, isEth: boolean }) => (
    <div 
        className={`glass-card p-4 md:p-5 flex items-center gap-4 group transition-all duration-500 hover:scale-110 w-[280px] md:w-[320px] flex-shrink-0 relative overflow-hidden ${
            member.isLead ? 'border-2' : ''
        }`}
        style={{
            borderColor: member.isLead ? (isEth ? 'rgba(98,126,234,0.6)' : 'rgba(0,240,255,0.6)') : 'rgba(255,255,255,0.1)',
            boxShadow: member.isLead ? (isEth ? '0 0 40px rgba(98,126,234,0.2)' : '0 0 40px rgba(0,240,255,0.2)') : 'none',
            background: isEth ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 10, 22, 0.85)'
        }}
    >
        <div 
            className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-500 group-hover:rotate-2 shadow-lg"
            style={{
                borderColor: isEth ? 'rgba(98,126,234,0.4)' : 'rgba(0,240,255,0.4)',
            }}
        >
            <Image
                src={member.image}
                alt={member.name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
            />
        </div>
        
        <div className="flex flex-col text-left overflow-hidden">
            <h3 className="text-base md:text-lg font-bold mb-0.5 truncate">{member.name}</h3>
            <p className={`text-[10px] md:text-xs font-semibold mb-2 transition-colors duration-1000 ${isEth ? 'text-indigo-600' : 'text-cyan-400'}`}>
                {member.role}
            </p>
            
            <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-opacity ${
                    isEth ? 'opacity-60 hover:opacity-100 hover:text-indigo-600' : 'opacity-50 hover:opacity-100 hover:text-cyan-400'
                }`}
            >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Connect
            </a>
        </div>
    </div>
);

export default function AboutUsPage() {
    const { theme } = useNetworkTheme();
    const isEth = theme === 'ethereum';

    return (
        <div className={`min-h-screen relative overflow-hidden flex flex-col items-center transition-colors duration-1000 ${isEth ? 'bg-[#f0f4ff]' : 'bg-[#050510]'}`}>
            
            {/* Background effects */}
            {!isEth && <ParticlesBackground />}
            
            <div 
                className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000" 
                style={{ backgroundColor: isEth ? 'rgba(98,126,234,0.15)' : 'rgba(0,240,255,0.15)' }}
            />
            <div 
                className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000" 
                style={{ backgroundColor: isEth ? 'rgba(147,197,253,0.15)' : 'rgba(98,126,234,0.15)' }}
            />
            
            {/* Overlay Gradient */}
            <div 
                className="absolute inset-0 pointer-events-none transition-all duration-1000" 
                style={{
                    background: isEth 
                        ? 'linear-gradient(to bottom, transparent, rgba(240,244,255,0.5), #f0f4ff)' 
                        : 'linear-gradient(to bottom, transparent, rgba(5,5,16,0.3), #050510)'
                }}
            />

            <div className="relative z-10 w-full max-w-4xl px-6 py-20 flex flex-col items-center">
                
                {/* Hero Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-3xl mb-16 md:mb-24"
                >
                    <h1 className={`text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent drop-shadow-lg transition-all duration-1000 ${
                        isEth ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-700' : 'bg-gradient-to-r from-teal-300 via-cyan-400 to-blue-500'
                    }`}>
                        The OVHcloud Web3 Team
                    </h1>
                    <p className="text-xl opacity-70 leading-relaxed">
                        A dedicated group of Web3 native experts connecting the infrastructure you trust.
                    </p>
                </motion.div>

                {/* Team Section - Infinite Horizontal Marquee (Single Row) */}
                <div className="w-[100vw] relative py-12 overflow-hidden left-1/2 -translate-x-1/2 group">
                    <style jsx>{`
                        @keyframes marquee {
                            0% { transform: translateX(-1760px); }
                            100% { transform: translateX(0); }
                        }
                        .animate-marquee {
                            display: flex;
                            gap: 2rem;
                            padding-left: 1rem;
                            animation: marquee 40s linear infinite;
                        }
                        .group:hover .animate-marquee {
                            animation-play-state: paused;
                        }
                    `}</style>
                    
                    {/* Single Row - Left to Right */}
                    <div className="animate-marquee">
                        {[...teamMembers, ...teamMembers, ...teamMembers, ...teamMembers].map((member, idx) => (
                            <TeamCard key={`${member.name}-row-${idx}`} member={member} isEth={isEth} />
                        ))}
                    </div>

                    {/* Gradient Fades for the edges */}
                    <div className={`absolute inset-y-0 left-0 w-48 z-10 pointer-events-none transition-all duration-1000 ${isEth ? 'bg-gradient-to-r from-[#f0f4ff] to-transparent' : 'bg-gradient-to-r from-[#050510] to-transparent'}`} />
                    <div className={`absolute inset-y-0 right-0 w-48 z-10 pointer-events-none transition-all duration-1000 ${isEth ? 'bg-gradient-to-l from-[#f0f4ff] to-transparent' : 'bg-gradient-to-l from-[#050510] to-transparent'}`} />
                </div>

                {/* Professional Services & Solutions Architects */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="w-full rounded-3xl p-10 md:p-16 mb-32 relative overflow-hidden border transition-all duration-1000"
                    style={{
                        background: isEth 
                            ? 'linear-gradient(to right, rgba(98,126,234,0.05), rgba(147,197,253,0.05))'
                            : 'linear-gradient(to right, rgba(0,240,255,0.05), rgba(98,126,234,0.05))',
                        borderColor: isEth ? 'rgba(98,126,234,0.2)' : 'rgba(0,240,255,0.2)'
                    }}
                >
                    <div 
                        className="absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none transition-colors duration-1000" 
                        style={{ backgroundColor: isEth ? 'rgba(98,126,234,0.1)' : 'rgba(0,240,255,0.1)' }}
                    />
                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-black mb-6">Expertise beyond infrastructure.</h2>
                            <p className="text-lg opacity-70 mb-6 leading-relaxed">
                                Deploying robust Web3 infrastructure requires more than just servers. It requires deep architectural knowledge and strategic planning.
                            </p>
                            <p className="text-lg opacity-70 mb-8 leading-relaxed">
                                That is why our team includes dedicated <strong>Web3 Solutions Architects</strong> who provide hands-on Professional Services. We co-design architectures, optimize node deployments, and ensure high availability for your blockchain operations.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Custom High Availability setup',
                                    'Node optimization and scaling',
                                    'Security and compliance counseling',
                                    'Dedicated ongoing technical support'
                                ].map(item => (
                                    <li key={item} className={`flex items-center gap-3 ${isEth ? 'text-indigo-800' : 'text-cyan-200'}`}>
                                        <svg className={`w-5 h-5 ${isEth ? 'text-indigo-500' : 'text-cyan-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex justify-center">
                            {/* Abstract visual representation of nodes / architecture */}
                            <div 
                                className="relative w-full max-w-sm aspect-square border rounded-full flex items-center justify-center transition-colors duration-1000"
                                style={{
                                    backgroundColor: isEth ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                    borderColor: isEth ? 'rgba(98,126,234,0.2)' : 'rgba(255,255,255,0.1)'
                                }}
                            >
                                <div 
                                    className="absolute inset-0 blur-[50px] rounded-full animate-pulse transition-colors duration-1000" 
                                    style={{ backgroundColor: isEth ? 'rgba(98,126,234,0.15)' : 'rgba(0,240,255,0.2)' }}
                                />
                                <svg 
                                    className="w-32 h-32 opacity-80 transition-colors duration-1000" 
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}
                                    style={{ color: isEth ? '#627EEA' : '#00F0FF' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Contact Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="w-full max-w-4xl text-center"
                    id="contact-section"
                >
                    <h2 className="text-4xl font-black mb-6">Let's build the decentralized future.</h2>
                    <p className="text-xl opacity-60 mb-10 max-w-2xl mx-auto">
                        Whether you are looking to scale your validator nodes, build a new L2, or just explore our bare metal offerings, we are here to help.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <a 
                            href="mailto:blockchain@ovhcloud.com" 
                            className={`font-bold text-lg px-8 py-4 rounded-xl flex items-center gap-3 transition-all duration-300 hover:scale-105 ${
                                isEth 
                                    ? 'bg-[#627EEA] hover:bg-indigo-500 text-white shadow-[0_0_40px_rgba(98,126,234,0.3)] hover:shadow-[0_0_60px_rgba(98,126,234,0.5)]' 
                                    : 'bg-[#00F0FF] hover:bg-cyan-400 text-black shadow-[0_0_40px_rgba(0,240,255,0.4)] hover:shadow-[0_0_60px_rgba(0,240,255,0.6)]'
                            }`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send us an Email
                        </a>
                        
                        <a 
                            href="#" 
                            className={`glass-card font-bold text-lg px-8 py-4 !rounded-xl flex items-center gap-3 transition-colors duration-300`}
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.2-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.06-.2-.07-.06-.17-.04-.25-.02-.11.02-1.79 1.14-5.06 3.34-.48.33-.91.49-1.3.48-.43-.01-1.24-.24-1.84-.44-.73-.24-1.31-.36-1.26-.77.03-.21.3-.43.82-.66 3.23-1.4 5.38-2.32 6.46-2.77 3.07-1.28 3.71-1.5 4.13-1.51.09 0 .3.02.41.11.09.07.12.17.13.25 0 .04.01.12.01.19z"/>
                            </svg>
                            Join Telegram Group
                        </a>
                    </div>
                </motion.div>
                
            </div>
        </div>
    );
}


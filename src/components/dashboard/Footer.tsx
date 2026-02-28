import Image from 'next/image';

export default function Footer() {
    const teamMembers = [
        {
            name: 'Alexandre Al Ajroudi',
            role: 'Blockchain & Web3 lead France BeNeLux',
            linkedin: 'https://www.linkedin.com/in/alexandre-al-ajroudi-☁️-1706651a6/',
            photo: '/team/Alexandre.jpeg'
        },
        {
            name: 'Omar Abi Issa',
            role: 'Blockchain & web3 Global lead',
            linkedin: 'https://www.linkedin.com/in/omarabiissa/',
            photo: '/team/Omar.jpeg'
        },
        {
            name: 'Benoit Baillon',
            role: 'Corporate Blockchain Account manager - France',
            linkedin: 'https://www.linkedin.com/in/benoit-baillon-cloud/',
            photo: '/team/Benoit.jpeg'
        }
    ];

    return (
        <footer className="relative border-t border-white/10 bg-[#000E1E] mt-12">
            {/* Gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent opacity-50"></div>

            <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
                {/* Contact Us Section */}
                <div className="mb-6 md:mb-8">
                    <h3 className="text-center text-lg md:text-xl font-semibold text-white mb-6 md:mb-8 tracking-wide">
                        Contact Us
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
                        {teamMembers.map((member, index) => (
                            <a
                                key={index}
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col items-center text-center p-4 md:p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#00F0FF]/50 transition-all duration-300 hover:bg-white/10 hover:scale-105"
                            >
                                {/* Photo */}
                                <div className="relative w-16 h-16 md:w-24 md:h-24 mb-3 md:mb-4 rounded-full overflow-hidden border-2 border-[#00F0FF]/30 group-hover:border-[#00F0FF] transition-all duration-300">
                                    <Image
                                        src={member.photo}
                                        alt={member.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Name */}
                                <h4 className="text-white font-semibold text-base md:text-lg mb-1 md:mb-2 group-hover:text-[#00F0FF] transition-colors duration-300">
                                    {member.name}
                                </h4>

                                {/* Role */}
                                <p className="text-gray-400 text-xs md:text-sm mb-2 md:mb-3 leading-relaxed">
                                    {member.role}
                                </p>

                                {/* LinkedIn Icon */}
                                <div className="flex items-center gap-2 text-[#00F0FF] group-hover:text-[#00D4E6] transition-colors duration-300">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                    </svg>
                                    <span className="text-sm font-medium">Connect</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center border-t border-white/10 pt-8">
                    <p className="text-gray-400 text-sm">
                        Powered by{' '}
                        <a
                            href="https://www.ovhcloud.com/en/bare-metal"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00F0FF] hover:text-[#00D4E6] font-semibold transition-colors duration-200 hover:underline"
                        >
                            OVHcloud Bare Metal
                        </a>
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        Real-time Solana infrastructure monitoring • Data refreshed every 5 minutes
                    </p>
                </div>
            </div>
        </footer>
    );
}

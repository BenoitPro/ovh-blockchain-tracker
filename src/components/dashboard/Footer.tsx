export default function Footer() {
    return (
        <footer className="relative border-t border-white/10 bg-[#000E1E] mt-12">
            {/* Gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-50" style={{ backgroundImage: 'linear-gradient(to right, transparent, var(--chain-accent), transparent)' }}></div>

            <div className="container mx-auto px-4 md:px-6 py-6 border-t border-white/10">
                {/* Footer Info */}
                <div className="text-center">
                    <p className="text-gray-400 text-sm">
                        Powered by{' '}
                        <a
                            href="https://www.ovhcloud.com/en/bare-metal"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold transition-colors duration-200 hover:underline hover:text-white"
                            style={{ color: 'var(--chain-accent)' }}
                        >
                            OVHcloud Bare Metal
                        </a>
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        Real-time infrastructure monitoring • Data refreshed every 5 minutes
                    </p>
                </div>
            </div>
        </footer>
    );
}

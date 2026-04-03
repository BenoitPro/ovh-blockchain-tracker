export default function LoadingState({
    fullPage = false,

    message = "Collecting Data...",
    network = 'solana'
}: {
    fullPage?: boolean,
    message?: string,
    network?: 'solana' | 'ethereum' | 'avalanche'
}) {
    const isEth = network === 'ethereum';
    const isAvax = network === 'avalanche';

    // Base colors based on network
    const primaryColor = isEth ? '#627EEA' : isAvax ? '#E84142' : '#00F0FF';
    const secondaryColor = isEth ? '#8B5CF6' : isAvax ? '#FF6B6B' : '#A855F7';
    const textColor = isEth ? '#3730A3' : isAvax ? '#FF3333' : '#00F0FF'; // Darker indigo for Eth text contrast

    // If fullPage is true, we want it to overlay everything with a slight glass effect
    // If false (default), we want it to take up the available space transparently
    const containerClasses = fullPage
        ? `fixed inset-0 z-50 flex flex-col items-center justify-center ${isEth ? 'bg-white/40' : 'bg-[#050510]/40'} backdrop-blur-sm`
        : 'flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full bg-transparent';


    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center space-y-8">
                {/* Advanced Premium Loading Spinner */}
                <div className="relative w-24 h-24">
                    {/* Outer glowing ring */}
                    <div 
                        className="absolute inset-0 border-4 rounded-full" 
                        style={{ borderColor: `${primaryColor}1A`, boxShadow: `0 0 20px ${primaryColor}1A` }}
                    ></div>
                    
                    {/* Primary spinning arc */}
                    <div 
                        className="absolute inset-0 border-4 border-t-transparent border-l-transparent rounded-full animate-spin"
                        style={{ borderTopColor: primaryColor, borderRightColor: `${primaryColor}66` }}
                    ></div>
                    
                    {/* Inner pulsing glow */}
                    <div 
                        className="absolute inset-4 rounded-full animate-pulse blur-xl"
                        style={{ background: `linear-gradient(to top right, ${primaryColor}33, ${secondaryColor}1A)` }}
                    ></div>
                    
                    {/* Small inner reverse spinner */}
                    <div 
                        className="absolute inset-6 border-2 border-t-transparent border-r-transparent rounded-full animate-spin-reverse"
                        style={{ borderBottomColor: `${secondaryColor}99`, borderLeftColor: `${secondaryColor}66` }}
                    ></div>
                </div>


                <div className="flex flex-col items-center space-y-4">
                    <p 
                        className="font-mono text-base md:text-lg lg:text-xl uppercase tracking-[0.4em] animate-pulse"

                        style={{ color: textColor, filter: isEth ? 'none' : `drop-shadow(0 0 8px ${primaryColor}66)` }}
                    >
                        {message}
                    </p>
                    
                    {/* Progress dots with staggered animation */}
                    <div className="flex justify-center space-x-3">
                        {[0, 150, 300].map((delay) => (
                            <div 
                                key={delay}
                                className="w-2 h-2 rounded-full animate-pulse" 
                                style={{ 
                                    backgroundColor: primaryColor, 
                                    boxShadow: `0 0 8px ${primaryColor}99`,
                                    animationDelay: `${delay}ms` 
                                }}
                            ></div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

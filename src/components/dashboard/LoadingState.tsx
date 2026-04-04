export default function LoadingState({
    fullPage = false,
    message = "Collecting Data...",
}: {
    fullPage?: boolean,
    message?: string,
}) {
    // If fullPage is true, we want it to overlay everything with a slight glass effect
    // If false (default), we want it to take up the available space transparently
    const containerClasses = fullPage
        ? `fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050510]/40 backdrop-blur-sm`
        : 'flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full bg-transparent';


    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center space-y-8">
                {/* Advanced Premium Loading Spinner */}
                <div className="relative w-24 h-24">
                    {/* Outer glowing ring */}
                    <div 
                        className="absolute inset-0 border-4 rounded-full border-[var(--chain-accent)]/10 shadow-[0_0_20px_var(--chain-accent)]" 
                    ></div>
                    
                    {/* Primary spinning arc */}
                    <div 
                        className="absolute inset-0 border-4 border-[var(--chain-accent)] border-b-[var(--chain-accent)]/40 border-t-transparent border-l-transparent rounded-full animate-spin"
                    ></div>
                    
                    {/* Inner pulsing glow */}
                    <div 
                        className="absolute inset-4 rounded-full animate-pulse blur-xl bg-[var(--chain-accent)]/20"
                    ></div>
                    
                    {/* Small inner reverse spinner */}
                    <div 
                        className="absolute inset-6 border-2 border-slate-500/60 border-t-transparent border-r-transparent rounded-full animate-spin-reverse"
                    ></div>
                </div>


                <div className="flex flex-col items-center space-y-4">
                    <p 
                        className="font-mono text-base md:text-lg lg:text-xl uppercase tracking-[0.4em] animate-pulse text-[var(--chain-accent)] drop-shadow-[0_0_8px_var(--chain-accent)]"
                    >
                        {message}
                    </p>
                    
                    {/* Progress dots with staggered animation */}
                    <div className="flex justify-center space-x-3">
                        {[0, 150, 300].map((delay) => (
                            <div 
                                key={delay}
                                className="w-2 h-2 rounded-full animate-pulse bg-[var(--chain-accent)] shadow-[0_0_8px_var(--chain-accent)]" 
                                style={{ 
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

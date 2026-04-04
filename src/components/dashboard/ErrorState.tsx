import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
    const bgClass = 'bg-[#000E1E]';
    const textClass = 'text-white';
    const subTextClass = 'text-gray-400';
    const btnClass = 'bg-[#00F0FF] hover:bg-[#00D4E6] text-[#000E1E]';

    return (
        <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
            <div className="text-center max-w-md mx-auto px-6">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-10 h-10 text-red-400" />
                </div>

                <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>
                    Unable to Load Data
                </h2>
                <p className={`mb-6 ${subTextClass}`}>
                    {message}
                </p>

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className={`px-6 py-3 rounded-xl font-semibold transition-colors duration-200 ${btnClass}`}
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}

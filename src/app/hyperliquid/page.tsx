import HyperliquidDashboard from '@/components/dashboard/HyperliquidDashboard';
import { HyperliquidAPIResponse } from '@/types/hyperliquid';

/**
 * Hyperliquid dashboard page — server component.
 *
 * Fetches live data from /api/hyperliquid (backed by the Turso cache populated
 * by the daily cron at /api/cron/hyperliquid-refresh).
 *
 * Gracefully handles:
 *   - 503: cache not yet populated (cron hasn't run)
 *   - Network / parsing errors
 */
export default async function HyperliquidPage() {
    let apiResponse: HyperliquidAPIResponse | null = null;
    let fetchError: string | null = null;

    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const res = await fetch(`${baseUrl}/api/hyperliquid`, {
            cache: 'no-store',
        });

        if (res.status === 503) {
            fetchError = 'not-ready';
        } else if (!res.ok) {
            fetchError = `HTTP ${res.status}`;
        } else {
            apiResponse = (await res.json()) as HyperliquidAPIResponse;
            if (!apiResponse.success || !apiResponse.data) {
                fetchError = apiResponse.error ?? 'Unknown error';
                apiResponse = null;
            }
        }
    } catch (err) {
        fetchError = err instanceof Error ? err.message : 'Network error';
    }

    // ── No data yet — graceful fallback ───────────────────────────────────────
    if (!apiResponse?.data) {
        return (
            <div className="relative min-h-screen flex items-center justify-center p-8">
                <div
                    className="max-w-lg w-full rounded-2xl p-8 border text-center"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0, 229, 190, 0.05), rgba(0,0,0,0.4))',
                        borderColor: 'rgba(0, 229, 190, 0.2)',
                    }}
                >
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(0, 229, 190, 0.1)', border: '1px solid rgba(0, 229, 190, 0.3)' }}
                    >
                        <svg className="w-6 h-6 text-[#00E5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Data is being collected</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        {fetchError === 'not-ready'
                            ? 'The Hyperliquid validator data is being indexed for the first time. Check back shortly — it usually takes less than a minute.'
                            : `Unable to load Hyperliquid data (${fetchError ?? 'unknown error'}). Please try again in a few moments.`}
                    </p>
                    <a
                        href="/hyperliquid"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-black hover:scale-105"
                        style={{ background: '#00E5BE' }}
                    >
                        Retry
                    </a>
                </div>
            </div>
        );
    }

    // Fallback timestamp: if the API omits it, use 0 (the dashboard will still render)
    const cachedAt = apiResponse.timestamp ?? 0;

    return (
        <HyperliquidDashboard
            metrics={apiResponse.data}
            cachedAt={cachedAt}
            isStale={apiResponse.stale}
        />
    );
}

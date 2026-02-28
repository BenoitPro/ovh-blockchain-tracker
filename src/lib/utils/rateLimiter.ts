/**
 * Simple rate limiter with exponential backoff
 * Prevents overwhelming the IP API with requests
 */
export class RateLimiter {
    private queue: Array<() => Promise<void>> = [];
    private processing = false;
    private delayMs: number;
    private maxRetries: number;

    constructor(delayMs: number = 100, maxRetries: number = 3) {
        this.delayMs = delayMs;
        this.maxRetries = maxRetries;
    }

    /**
     * Add a task to the queue with automatic retry on 429 errors
     */
    async execute<T>(task: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                // Wait before executing
                await this.delay(this.delayMs * (attempt + 1));

                const result = await task();
                return result;
            } catch (error) {
                lastError = error as Error;

                // If it's a 429 (rate limit), wait longer and retry
                if (error instanceof Error && error.message.includes('429')) {
                    console.warn(`[RateLimiter] Rate limited, retry ${attempt + 1}/${this.maxRetries}`);
                    await this.delay(1000 * Math.pow(2, attempt)); // Exponential backoff
                    continue;
                }

                // For other errors, throw immediately
                throw error;
            }
        }

        throw lastError || new Error('Max retries exceeded');
    }

    /**
     * Process multiple tasks with rate limiting
     */
    async executeAll<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
        const results: T[] = [];

        for (const task of tasks) {
            try {
                const result = await this.execute(task);
                results.push(result);
            } catch (error) {
                console.error('[RateLimiter] Task failed:', error);
                // Continue with other tasks even if one fails
            }
        }

        return results;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

import { getDatabase } from './database';
import { DashboardMetrics, HistoricalMetrics, TrendDataPoint, TrendPeriod } from '@/types';
import { logger } from '@/lib/utils';

/**
 * Repository for managing historical metrics in SQLite
 */
export class MetricsRepository {
    /**
     * Save daily metrics snapshot to database
     * Prevents duplicate entries for the same day (based on date, not exact timestamp)
     * @param metrics - Dashboard metrics to save
     * @param customTimestamp - Optional custom timestamp (for seeding historical data)
     */
    static saveMetrics(metrics: DashboardMetrics, customTimestamp?: number): void {
        const db = getDatabase();

        // Use custom timestamp if provided, otherwise use current date
        const now = customTimestamp ? new Date(customTimestamp) : new Date();
        const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const timestamp = dayStart.getTime();

        try {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO metrics_history (
                    timestamp,
                    total_nodes,
                    ovh_nodes,
                    market_share,
                    estimated_revenue,
                    geo_distribution,
                    provider_distribution
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                timestamp,
                metrics.totalNodes,
                metrics.ovhNodes,
                metrics.marketShare,
                metrics.estimatedRevenue,
                JSON.stringify(metrics.geoDistribution),
                JSON.stringify(metrics.providerDistribution)
            );

            logger.info(`[MetricsRepository] Saved metrics for ${dayStart.toISOString().split('T')[0]}`);
        } catch (error) {
            logger.error('[MetricsRepository] Failed to save metrics:', error);
            throw error;
        }
    }

    /**
     * Get metrics for a specific time period or all history
     * Returns data points ordered by timestamp (oldest first)
     */
    static getMetricsByPeriod(period: TrendPeriod): TrendDataPoint[] {
        if (period === 'all') {
            return MetricsRepository.getAllMetrics();
        }

        const db = getDatabase();

        // Calculate cutoff timestamp (start of day, N days ago)
        const cutoffDate = new Date();
        cutoffDate.setUTCDate(cutoffDate.getUTCDate() - (period as number));
        cutoffDate.setUTCHours(0, 0, 0, 0);
        const cutoffTimestamp = cutoffDate.getTime();

        try {
            const stmt = db.prepare(`
                SELECT
                    timestamp,
                    total_nodes,
                    ovh_nodes,
                    market_share
                FROM metrics_history
                WHERE timestamp >= ?
                ORDER BY timestamp ASC
            `);

            const rows = stmt.all(cutoffTimestamp) as HistoricalMetrics[];

            return rows.map(row => ({
                timestamp: row.timestamp,
                date: new Date(row.timestamp).toISOString().split('T')[0],
                marketShare: row.market_share,
                ovhNodes: row.ovh_nodes,
                totalNodes: row.total_nodes,
            }));
        } catch (error) {
            logger.error(`[MetricsRepository] Failed to get metrics for ${period} days:`, error);
            throw error;
        }
    }

    /**
     * Get all historical metrics (used for 'all' period)
     */
    static getAllMetrics(): TrendDataPoint[] {
        const db = getDatabase();

        try {
            const stmt = db.prepare(`
                SELECT
                    timestamp,
                    total_nodes,
                    ovh_nodes,
                    market_share
                FROM metrics_history
                ORDER BY timestamp ASC
            `);

            const rows = stmt.all() as HistoricalMetrics[];

            return rows.map(row => ({
                timestamp: row.timestamp,
                date: new Date(row.timestamp).toISOString().split('T')[0],
                marketShare: row.market_share,
                ovhNodes: row.ovh_nodes,
                totalNodes: row.total_nodes,
            }));
        } catch (error) {
            logger.error('[MetricsRepository] Failed to get all metrics:', error);
            throw error;
        }
    }

    /**
     * Get the most recent metrics entry
     * Useful as a fallback when cache is empty
     */
    static getLatestMetrics(): HistoricalMetrics | null {
        const db = getDatabase();

        try {
            const stmt = db.prepare(`
                SELECT * FROM metrics_history
                ORDER BY timestamp DESC
                LIMIT 1
            `);

            return stmt.get() as HistoricalMetrics | null;
        } catch (error) {
            logger.error('[MetricsRepository] Failed to get latest metrics:', error);
            return null;
        }
    }

    /**
     * Delete old metrics beyond retention period
     * Default: keep 2000 days of history (~5.5 years)
     */
    static deleteOldMetrics(retentionDays: number = 2000): number {
        const db = getDatabase();

        const cutoffDate = new Date();
        cutoffDate.setUTCDate(cutoffDate.getUTCDate() - retentionDays);
        cutoffDate.setUTCHours(0, 0, 0, 0);
        const cutoffTimestamp = cutoffDate.getTime();

        try {
            const stmt = db.prepare(`
                DELETE FROM metrics_history
                WHERE timestamp < ?
            `);

            const result = stmt.run(cutoffTimestamp);

            if (result.changes > 0) {
                logger.info(`[MetricsRepository] Deleted ${result.changes} old metrics entries`);
            }

            return result.changes;
        } catch (error) {
            logger.error('[MetricsRepository] Failed to delete old metrics:', error);
            throw error;
        }
    }

    /**
     * Get total count of historical records
     */
    static getRecordCount(): number {
        const db = getDatabase();

        try {
            const stmt = db.prepare('SELECT COUNT(*) as count FROM metrics_history');
            const result = stmt.get() as { count: number };
            return result.count;
        } catch (error) {
            logger.error('[MetricsRepository] Failed to get record count:', error);
            return 0;
        }
    }

    /**
     * Get date range of available data
     */
    static getDateRange(): { oldest: Date | null; newest: Date | null } {
        const db = getDatabase();

        try {
            const stmt = db.prepare(`
                SELECT 
                    MIN(timestamp) as oldest,
                    MAX(timestamp) as newest
                FROM metrics_history
            `);

            const result = stmt.get() as { oldest: number | null; newest: number | null };

            return {
                oldest: result.oldest ? new Date(result.oldest) : null,
                newest: result.newest ? new Date(result.newest) : null,
            };
        } catch (error) {
            logger.error('[MetricsRepository] Failed to get date range:', error);
            return { oldest: null, newest: null };
        }
    }
}

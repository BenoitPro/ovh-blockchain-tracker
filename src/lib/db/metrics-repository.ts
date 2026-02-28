import { getDatabase } from './database';
import { DashboardMetrics, HistoricalMetrics, TrendDataPoint, TrendPeriod } from '@/types';
import { logger } from '@/lib/utils';

/**
 * Repository for managing historical metrics in SQLite via Turso (libSQL)
 */
export class MetricsRepository {
    /**
     * Save daily metrics snapshot to database
     * Prevents duplicate entries for the same day (based on date, not exact timestamp)
     */
    static async saveMetrics(metrics: DashboardMetrics, customTimestamp?: number): Promise<void> {
        const db = getDatabase();

        const now = customTimestamp ? new Date(customTimestamp) : new Date();
        const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const timestamp = dayStart.getTime();

        try {
            await db.execute({
                sql: `
                    INSERT OR REPLACE INTO metrics_history (
                        timestamp,
                        total_nodes,
                        ovh_nodes,
                        market_share,
                        estimated_revenue,
                        geo_distribution,
                        provider_distribution
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                args: [
                    timestamp,
                    metrics.totalNodes,
                    metrics.ovhNodes,
                    metrics.marketShare,
                    0, // estimated_revenue is no longer tracked
                    JSON.stringify(metrics.geoDistribution),
                    JSON.stringify(metrics.providerDistribution)
                ]
            });

            logger.info(`[MetricsRepository] Saved metrics for ${dayStart.toISOString().split('T')[0]}`);
        } catch (error) {
            logger.error('[MetricsRepository] Failed to save metrics:', error);
            throw error;
        }
    }

    /**
     * Get metrics for a specific time period or all history
     */
    static async getMetricsByPeriod(period: TrendPeriod): Promise<TrendDataPoint[]> {
        if (period === 'all') {
            return MetricsRepository.getAllMetrics();
        }

        const db = getDatabase();

        const cutoffDate = new Date();
        cutoffDate.setUTCDate(cutoffDate.getUTCDate() - (period as number));
        cutoffDate.setUTCHours(0, 0, 0, 0);
        const cutoffTimestamp = cutoffDate.getTime();

        try {
            const result = await db.execute({
                sql: `
                    SELECT
                        timestamp,
                        total_nodes,
                        ovh_nodes,
                        market_share
                    FROM metrics_history
                    WHERE timestamp >= ?
                    ORDER BY timestamp ASC
                `,
                args: [cutoffTimestamp]
            });

            return result.rows.map(row => ({
                timestamp: row.timestamp as number,
                date: new Date(row.timestamp as number).toISOString().split('T')[0],
                marketShare: row.market_share as number,
                ovhNodes: row.ovh_nodes as number,
                totalNodes: row.total_nodes as number,
            }));
        } catch (error) {
            logger.error(`[MetricsRepository] Failed to get metrics for ${period} days:`, error);
            throw error;
        }
    }

    /**
     * Get all historical metrics
     */
    static async getAllMetrics(): Promise<TrendDataPoint[]> {
        const db = getDatabase();

        try {
            const result = await db.execute(`
                SELECT
                    timestamp,
                    total_nodes,
                    ovh_nodes,
                    market_share
                FROM metrics_history
                ORDER BY timestamp ASC
            `);

            return result.rows.map(row => ({
                timestamp: row.timestamp as number,
                date: new Date(row.timestamp as number).toISOString().split('T')[0],
                marketShare: row.market_share as number,
                ovhNodes: row.ovh_nodes as number,
                totalNodes: row.total_nodes as number,
            }));
        } catch (error) {
            logger.error('[MetricsRepository] Failed to get all metrics:', error);
            throw error;
        }
    }

    /**
     * Get the most recent metrics entry
     */
    static async getLatestMetrics(): Promise<HistoricalMetrics | null> {
        const db = getDatabase();

        try {
            const result = await db.execute(`
                SELECT * FROM metrics_history
                ORDER BY timestamp DESC
                LIMIT 1
            `);

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                id: row.id as number,
                timestamp: row.timestamp as number,
                total_nodes: row.total_nodes as number,
                ovh_nodes: row.ovh_nodes as number,
                market_share: row.market_share as number,
                estimated_revenue: row.estimated_revenue as number,
                geo_distribution: row.geo_distribution as string,
                provider_distribution: row.provider_distribution as string,
                created_at: row.created_at as number
            };
        } catch (error) {
            logger.error('[MetricsRepository] Failed to get latest metrics:', error);
            return null;
        }
    }

    /**
     * Delete old metrics beyond retention period
     */
    static async deleteOldMetrics(retentionDays: number = 2000): Promise<number> {
        const db = getDatabase();

        const cutoffDate = new Date();
        cutoffDate.setUTCDate(cutoffDate.getUTCDate() - retentionDays);
        cutoffDate.setUTCHours(0, 0, 0, 0);
        const cutoffTimestamp = cutoffDate.getTime();

        try {
            const result = await db.execute({
                sql: `DELETE FROM metrics_history WHERE timestamp < ?`,
                args: [cutoffTimestamp]
            });

            if (result.rowsAffected > 0) {
                logger.info(`[MetricsRepository] Deleted ${result.rowsAffected} old metrics entries`);
            }

            return result.rowsAffected;
        } catch (error) {
            logger.error('[MetricsRepository] Failed to delete old metrics:', error);
            throw error;
        }
    }

    /**
     * Get total count of historical records
     */
    static async getRecordCount(): Promise<number> {
        const db = getDatabase();

        try {
            const result = await db.execute('SELECT COUNT(*) as count FROM metrics_history');
            return Number(result.rows[0].count) || 0;
        } catch (error) {
            logger.error('[MetricsRepository] Failed to get record count:', error);
            return 0;
        }
    }
}

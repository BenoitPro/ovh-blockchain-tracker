import { createClient, Client } from '@libsql/client';
import { logger } from '@/lib/utils';
import { getEnvConfig } from '@/lib/config/env';
import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');

// Singleton connection persisted across HMR reloads
const globalForDb = globalThis as unknown as {
    db: Client | undefined;
    isInitialized: boolean;
};

let db: Client | undefined = globalForDb.db;
let isInitialized = globalForDb.isInitialized ?? false;

/**
 * Get or create the Turso database connection
 * Singleton pattern to ensure only one connection exists
 */
export function getDatabase(): Client {
    if (globalForDb.db) {
        if (!globalForDb.isInitialized) {
            initializeSchema(globalForDb.db);
            globalForDb.isInitialized = true;
            isInitialized = true;
        }
        return globalForDb.db;
    }

    const { tursoUrl, tursoAuthToken } = getEnvConfig();

    if (!tursoUrl) {
        logger.warn('[Database] TURSO_DATABASE_URL is not set. Using local file format for libSQL (testing only).');
    }

    try {
        // Create database client
        globalForDb.db = createClient({
            url: tursoUrl || 'file:./data/metrics.db', // Fallback for local testing
            authToken: tursoAuthToken,
        });
        db = globalForDb.db;

        logger.info(`[Database] Connected to Turso database: ${tursoUrl ? 'Remote' : 'Local'}`);

        // Initialize schema if needed
        if (!globalForDb.isInitialized) {
            initializeSchema(globalForDb.db);
            globalForDb.isInitialized = true;
            isInitialized = true;
        }

        return globalForDb.db;
    } catch (error) {
        logger.error('[Database] Failed to initialize database:', error);
        throw error;
    }
}

/**
 * Initialize database schema from schema.sql file and add cache table
 */
async function initializeSchema(database: Client): Promise<void> {
    try {
        let schema = '';
        try {
            schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        } catch (e) {
            // fallback if schema.sql is not found in production
            schema = `
                CREATE TABLE IF NOT EXISTS metrics_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp INTEGER NOT NULL UNIQUE,
                    total_nodes INTEGER NOT NULL,
                    ovh_nodes INTEGER NOT NULL,
                    market_share REAL NOT NULL,
                    estimated_revenue INTEGER NOT NULL,
                    geo_distribution TEXT NOT NULL,
                    provider_distribution TEXT NOT NULL,
                    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
                );
                CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_history(timestamp DESC);
                CREATE INDEX IF NOT EXISTS idx_metrics_market_share ON metrics_history(market_share);
            `;
        }

        // Add Cache Table schema
        schema += `
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                node_count INTEGER NOT NULL
            );
        `;

        // Benchmark provider snapshots — one row per worker run per chain
        schema += `
            CREATE TABLE IF NOT EXISTS benchmark_snapshots (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp          INTEGER NOT NULL,
                chain_id           TEXT NOT NULL,
                total_nodes        INTEGER NOT NULL,
                provider_breakdown TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_bs_chain_ts
                ON benchmark_snapshots(chain_id, timestamp);
        `;

        // Execute batch transaction
        await database.executeMultiple(schema);

        logger.info('[Database] Schema initialized successfully');
    } catch (error) {
        logger.error('[Database] Failed to initialize schema:', error);
    }
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
    if (globalForDb.db) {
        globalForDb.db.close();
        globalForDb.db = undefined;
        db = undefined;
        globalForDb.isInitialized = false;
        isInitialized = false;
        logger.info('[Database] Database connection closed');
    }
}


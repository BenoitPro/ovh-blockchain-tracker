import { createClient, Client } from '@libsql/client';
import { logger } from '@/lib/utils';
import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');

let db: Client | null = null;
let isInitialized = false;

/**
 * Get or create the Turso database connection
 * Singleton pattern to ensure only one connection exists
 */
export function getDatabase(): Client {
    if (db) {
        if (!isInitialized) {
            initializeSchema(db);
            isInitialized = true;
        }
        return db;
    }

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        logger.warn('[Database] TURSO_DATABASE_URL is not set. Using local file format for libSQL (testing only).');
    }

    try {
        // Create database client
        db = createClient({
            url: url || 'file:./data/metrics.db', // Fallback for local testing
            authToken: authToken,
        });

        logger.info(`[Database] Connected to Turso database: ${url ? 'Remote' : 'Local'}`);

        // Initialize schema if needed (fire and forget as it's async in libsql context when running multiple queries, we will await the batch)
        if (!isInitialized) {
            initializeSchema(db);
            isInitialized = true;
        }

        return db;
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

        // Split standard schema by statements
        const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);

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
    if (db) {
        db.close();
        db = null;
        isInitialized = false;
        logger.info('[Database] Database connection closed');
    }
}


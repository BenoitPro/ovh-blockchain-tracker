import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/utils';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'metrics.db');
const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');

let db: Database.Database | null = null;

/**
 * Get or create the SQLite database connection
 * Singleton pattern to ensure only one connection exists
 */
export function getDatabase(): Database.Database {
    if (db) {
        return db;
    }

    try {
        // Ensure data directory exists
        const dataDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            logger.info(`[Database] Created data directory: ${dataDir}`);
        }

        // Create or open database
        db = new Database(DB_PATH);
        logger.info(`[Database] Connected to SQLite database: ${DB_PATH}`);

        // Enable WAL mode for better concurrency
        db.pragma('journal_mode = WAL');

        // Initialize schema if needed
        initializeSchema(db);

        return db;
    } catch (error) {
        logger.error('[Database] Failed to initialize database:', error);
        throw error;
    }
}

/**
 * Initialize database schema from schema.sql file
 */
function initializeSchema(database: Database.Database): void {
    try {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        database.exec(schema);
        logger.info('[Database] Schema initialized successfully');
    } catch (error) {
        logger.error('[Database] Failed to initialize schema:', error);
        throw error;
    }
}

/**
 * Close the database connection
 * Should be called when the application shuts down
 */
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        logger.info('[Database] Database connection closed');
    }
}

/**
 * Get database statistics
 */
export function getDatabaseStats(): {
    path: string;
    size: number;
    recordCount: number;
} {
    const database = getDatabase();
    const stats = fs.statSync(DB_PATH);
    const result = database.prepare('SELECT COUNT(*) as count FROM metrics_history').get() as { count: number };

    return {
        path: DB_PATH,
        size: stats.size,
        recordCount: result.count,
    };
}

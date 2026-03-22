import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fix() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  
  console.log('Connecting to', url);
  
  const client = createClient({
    url: url!,
    authToken: token!
  });
  
  await client.execute(`
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                node_count INTEGER NOT NULL
            );
  `);
  console.log('Cache table created.');
  
  await client.execute(`
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
  `);
    console.log('history table created.');
}
fix().catch(console.error);

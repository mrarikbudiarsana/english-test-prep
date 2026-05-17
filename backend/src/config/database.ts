import { Pool, types } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

// Force DECIMAL (OID 1700) to be parsed as number/float instead of string
types.setTypeParser(1700, (val) => parseFloat(val));

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,                 // max connections in pool
  idleTimeoutMillis: 10000, // release idle connections after 10s (Neon idles fast)
  connectionTimeoutMillis: 10000, // fail fast if can't connect within 10s
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err.message });
  process.exit(-1);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.nodeEnv === 'development') {
    logger.debug('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
  }
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}

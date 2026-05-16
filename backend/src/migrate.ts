import fs from 'fs';
import path from 'path';
import { pool } from './config/database';

export async function runMigrations(shouldEndPool = false) {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    await client.query(`SELECT pg_advisory_lock(hashtext('english_tests_migrations'))`);
    lockAcquired = true;

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const migrationsDir = path.resolve(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`Skipping ${file} (already executed)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Executed ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`DATABASE MIGRATION ERROR: Failed to execute ${file}`);
        console.error(`Error Details:`, error instanceof Error ? error.message : error);
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } finally {
    if (lockAcquired) {
      try {
        await client.query(`SELECT pg_advisory_unlock(hashtext('english_tests_migrations'))`);
      } catch (error) {
        console.error('Failed to release migration advisory lock:', error);
      }
    }

    client.release();
    if (shouldEndPool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  runMigrations(true).catch(console.error);
}

import fs from 'fs';
import path from 'path';
import { pool } from './config/database';

async function runSeeds() {
    const client = await pool.connect();

    try {
        // Create seeds tracking table
        await client.query(`
      CREATE TABLE IF NOT EXISTS _seeds (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

        const seedsDir = path.resolve(__dirname, '../seeds');
        if (!fs.existsSync(seedsDir)) {
            console.log('Seeds directory not found.');
            return;
        }

        const files = fs.readdirSync(seedsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        if (files.length === 0) {
            console.log('No seed files found.');
            return;
        }

        for (const file of files) {
            const { rows } = await client.query(
                'SELECT id FROM _seeds WHERE filename = $1',
                [file]
            );

            if (rows.length > 0) {
                console.log(`Skipping ${file} (already executed)`);
                continue;
            }

            console.log(`Executing ${file}...`);
            const sql = fs.readFileSync(path.join(seedsDir, file), 'utf-8');

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO _seeds (filename) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`Successfully executed ${file}`);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`Failed to execute ${file}:`, error);
                throw error;
            }
        }

        console.log('Seeding completed.');
    } finally {
        client.release();
        await pool.end();
    }
}

runSeeds().catch(console.error);

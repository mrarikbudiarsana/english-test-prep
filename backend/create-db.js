const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to default 'postgres' database
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DATABASE_URL.match(/postgres:(.+)@/)[1],
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname='ielts_platform'"
    );

    if (result.rows.length === 0) {
      await client.query('CREATE DATABASE ielts_platform');
      console.log('✅ Database "ielts_platform" created successfully!');
    } else {
      console.log('✅ Database "ielts_platform" already exists');
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();

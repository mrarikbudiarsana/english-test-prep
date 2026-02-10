const { Client } = require('pg');
require('dotenv').config();

async function listUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const result = await client.query(
      'SELECT id, email, display_name, role, created_at FROM users ORDER BY created_at DESC'
    );

    if (result.rows.length === 0) {
      console.log('⚠️  No users found in database');
      console.log('Make sure you completed registration on the website!');
    } else {
      console.log('📋 Users in database:\n');
      result.rows.forEach((user, i) => {
        console.log(`${i + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.display_name || '(no name)'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

listUsers();

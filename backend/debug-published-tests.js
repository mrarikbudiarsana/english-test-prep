const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkPublishedTests() {
  try {
    // Check all tests
    const allTests = await pool.query(`
      SELECT id, title, is_published, is_free, duration_minutes
      FROM tests
      ORDER BY created_at DESC
    `);

    console.log('\n=== All Tests ===');
    allTests.rows.forEach(test => {
      console.log(`ID: ${test.id}`);
      console.log(`  Title: ${test.title}`);
      console.log(`  Published: ${test.is_published}`);
      console.log(`  Free: ${test.is_free}`);
      console.log(`  Duration: ${test.duration_minutes} minutes`);
      console.log('');
    });

    // Check published tests
    const publishedTests = await pool.query(`
      SELECT id, title, is_published, is_free, duration_minutes
      FROM tests
      WHERE is_published = true
      ORDER BY created_at DESC
    `);

    console.log('\n=== Published Tests (is_published = true) ===');
    if (publishedTests.rows.length === 0) {
      console.log('❌ No published tests found!');
    } else {
      console.log(`✓ Found ${publishedTests.rows.length} published test(s):`);
      publishedTests.rows.forEach(test => {
        console.log(`  - ${test.title} (${test.is_free ? 'Free' : 'Premium'}, ${test.duration_minutes || 0} min)`);
      });
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkPublishedTests();

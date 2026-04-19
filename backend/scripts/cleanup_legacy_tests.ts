import { pool } from '../src/config/database';

async function cleanup() {
  console.log('--- Starting Legacy Test Cleanup ---');
  
  try {
    // 1. Identify tests to delete
    const identifyRes = await pool.query(`
      SELECT id, title, test_type 
      FROM tests 
      WHERE test_type NOT IN ('toefl_itp')
    `);

    if (identifyRes.rows.length === 0) {
      console.log('No legacy tests found to delete.');
      return;
    }

    console.log(`Found ${identifyRes.rows.length} legacy tests to delete:`);
    console.table(identifyRes.rows);

    const testIds = identifyRes.rows.map(r => r.id);

    // 2. Delete attempts first (to be safe, though ON DELETE CASCADE should handle others)
    // Actually, attempts table usually has test_id too.
    console.log('Deleting associated attempts...');
    await pool.query('DELETE FROM attempts WHERE test_id = ANY($1)', [testIds]);

    // 3. Delete the tests (ON DELETE CASCADE will handle sections and questions)
    console.log('Deleting tests (this will cascade to sections and questions)...');
    const deleteRes = await pool.query('DELETE FROM tests WHERE id = ANY($1) RETURNING id', [testIds]);
    
    console.log(`Successfully deleted ${deleteRes.rowCount} tests.`);
    
    // 4. Verification
    const finalCount = await pool.query("SELECT count(*) FROM tests WHERE test_type NOT IN ('toefl_itp')");
    console.log(`Remaining legacy tests count: ${finalCount.rows[0].count}`);

  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await pool.end();
  }
}

cleanup();

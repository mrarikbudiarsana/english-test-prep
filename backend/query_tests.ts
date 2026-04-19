import { pool } from './src/config/database';

async function run() {
  try {
    const res = await pool.query(`
      SELECT s.id, s.section_type, s.test_id, t.title as test_title, t.test_type
      FROM sections s
      JOIN tests t ON s.test_id = t.id
    `);
    console.log('Sections:');
    console.table(res.rows);

    const questionsCount = await pool.query('SELECT count(*) FROM questions');
    console.log('\nTotal questions:', questionsCount.rows[0].count);

    const attemptsCount = await pool.query('SELECT count(*) FROM attempts');
    console.log('Total attempts:', attemptsCount.rows[0].count);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

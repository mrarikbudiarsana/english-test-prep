import { getClient } from './src/config/database';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const client = await getClient();
  try {
    console.log('\n--- TESTS ---');
    const testsRes = await client.query('SELECT * FROM tests');
    console.log(testsRes.rows);

    console.log('\n--- SECTIONS ---');
    const sectionsRes = await client.query('SELECT * FROM sections');
    console.log(sectionsRes.rows);

    console.log('\n--- QUESTIONS ---');
    const questionsRes = await client.query('SELECT * FROM questions');
    console.log(questionsRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}
check();

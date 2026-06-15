import { getClient } from './src/config/database';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const client = await getClient();
  try {
    const result = await client.query("SELECT id, title, passage_title, passage_text FROM sections WHERE section_type = 'reading' AND passage_text IS NOT NULL");
    console.log(`Found ${result.rowCount} reading sections with non-null passages:`);
    for (const row of result.rows) {
      console.log(`\n--- Section ID: ${row.id} | Title: ${row.title} | Passage Title: ${row.passage_title} ---`);
      console.log(`Passage Text Length: ${row.passage_text.length}`);
      console.log('Sample content (first 300 chars):');
      console.log(JSON.stringify(row.passage_text.substring(0, 300)));
      console.log('Number of newlines in text:', (row.passage_text.match(/\n/g) || []).length);
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}
check();

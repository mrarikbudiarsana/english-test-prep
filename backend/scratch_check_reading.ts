import { getClient } from './src/config/database';
async function check() {
  const c = await getClient();
  const r = await c.query("SELECT passage_text FROM sections WHERE section_type = 'reading' LIMIT 1");
  console.log(r.rows[0].passage_text.substring(0, 500));
  c.release();
  process.exit(0);
}
check();

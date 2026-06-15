import { getClient } from './src/config/database';
async function check() {
  const c = await getClient();
  const r = await c.query("SELECT id, title, part_number, section_type FROM sections WHERE section_type = 'structure'");
  console.log(r.rows);
  c.release();
  process.exit(0);
}
check();

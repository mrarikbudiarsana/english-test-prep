const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const testId4 = '8a01d1d0-c1b5-4cad-a1ee-d1046df858e8'; // Mock Test 4
  const jsonPath = path.resolve(__dirname, '../scratch_docs/Practice_Test_4_Complete.json');
  const test4Json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // Part B
  const bRecordings = test4Json.parts[1].recordings; // B1, B2
  const bSections = await pool.query("SELECT id, title, section_order, part_number FROM sections WHERE test_id = $1 AND section_type = 'listening' AND part_number = 2 ORDER BY section_order", [testId4]);
  
  if (bSections.rows.length >= 2 && bRecordings.length >= 2) {
    await pool.query("UPDATE sections SET passage_text = $1 WHERE id = $2", [bRecordings[0].transcript, bSections.rows[0].id]);
    console.log(`Updated Mock 4 Section "${bSections.rows[0].title}" passage_text with B1 transcript (${bRecordings[0].transcript.length} chars)`);
    
    await pool.query("UPDATE sections SET passage_text = $1 WHERE id = $2", [bRecordings[1].transcript, bSections.rows[1].id]);
    console.log(`Updated Mock 4 Section "${bSections.rows[1].title}" passage_text with B2 transcript (${bRecordings[1].transcript.length} chars)`);
  }

  // Part C
  const cRecordings = test4Json.parts[2].recordings; // C1, C2, C3
  const cSections = await pool.query("SELECT id, title, section_order, part_number FROM sections WHERE test_id = $1 AND section_type = 'listening' AND part_number = 3 ORDER BY section_order", [testId4]);
  
  if (cSections.rows.length >= 3 && cRecordings.length >= 3) {
    await pool.query("UPDATE sections SET passage_text = $1 WHERE id = $2", [cRecordings[0].transcript, cSections.rows[0].id]);
    console.log(`Updated Mock 4 Section "${cSections.rows[0].title}" passage_text with C1 transcript (${cRecordings[0].transcript.length} chars)`);
    
    await pool.query("UPDATE sections SET passage_text = $1 WHERE id = $2", [cRecordings[1].transcript, cSections.rows[1].id]);
    console.log(`Updated Mock 4 Section "${cSections.rows[1].title}" passage_text with C2 transcript (${cRecordings[1].transcript.length} chars)`);
    
    await pool.query("UPDATE sections SET passage_text = $1 WHERE id = $2", [cRecordings[2].transcript, cSections.rows[2].id]);
    console.log(`Updated Mock 4 Section "${cSections.rows[2].title}" passage_text with C3 transcript (${cRecordings[2].transcript.length} chars)`);
  }

  await pool.end();
}
main().catch(console.error);

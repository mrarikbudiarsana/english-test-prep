const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkColumns() {
  try {
    // Check if columns exist
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'questions'
      AND column_name IN ('group_label', 'group_instructions')
      ORDER BY column_name
    `);

    console.log('\n✓ Database columns for questions table:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check sample question data
    const questionResult = await pool.query(`
      SELECT id, question_number, group_label, group_instructions
      FROM questions
      LIMIT 5
    `);

    console.log('\n✓ Sample questions:');
    questionResult.rows.forEach(q => {
      console.log(`  Q${q.question_number}: group_label='${q.group_label}', group_instructions='${q.group_instructions ? q.group_instructions.substring(0, 50) + '...' : 'null'}'`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkColumns();

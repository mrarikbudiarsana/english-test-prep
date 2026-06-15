import { pool, query } from '../src/config/database';

async function renumber(sectionId: string, startNumber: number) {
  if (!sectionId) {
    console.error('Error: Please provide a Section ID.');
    return;
  }

  try {
    console.log(`Fetching questions for Section ID: ${sectionId}...`);
    const result = await query(
      'SELECT id, question_number, LEFT(question_text, 40) as excerpt FROM questions WHERE section_id = $1 ORDER BY question_number ASC',
      [sectionId]
    );

    const questions = result.rows;
    console.log(`Found ${questions.length} questions.`);

    if (questions.length === 0) {
      console.log('No questions found to renumber.');
      return;
    }

    console.log(`Renumbering questions starting from ${startNumber}...`);
    let currentNum = startNumber;

    // We do this in a simple transaction
    await query('BEGIN');
    
    for (const q of questions) {
      console.log(`  Updating Q${q.question_number} -> Q${currentNum} (${q.excerpt}...)`);
      await query(
        'UPDATE questions SET question_number = $1, updated_at = NOW() WHERE id = $2',
        [currentNum, q.id]
      );
      currentNum++;
    }

    await query('COMMIT');
    console.log('SUCCESS: All questions have been successfully renumbered!');

  } catch (err: any) {
    await query('ROLLBACK');
    console.error('Error during renumbering:', err.message);
  } finally {
    await pool.end();
  }
}

// Read arguments from command line
// Usage: npx ts-node renumber_questions.ts <section_id> <start_number>
const args = process.argv.slice(2);
const sectionId = args[0];
const startNumber = parseInt(args[1], 10) || 16;

renumber(sectionId, startNumber);

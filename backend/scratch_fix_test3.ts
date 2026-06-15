import { getClient } from './src/config/database';
import dotenv from 'dotenv';
dotenv.config();

async function fixTest3() {
  const client = await getClient();
  try {
    // Get all questions
    const questionsResult = await client.query(`SELECT id, question_text, question_data FROM questions WHERE question_type = 'multiple_choice'`);
    console.log(`Found ${questionsResult.rowCount} questions`);
    console.log('Questions:', questionsResult.rows);

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let updatedCount = 0;

    for (const q of questionsResult.rows) {
      const qData = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data;
      
      // If it already has <u> tags, skip it
      if (q.question_text.includes('<u>')) {
        continue;
      }

      if (qData && qData.options && Array.isArray(qData.options) && qData.options.length === 4) {
        let newText = q.question_text;
        let anyReplaced = false;

        qData.options.forEach((opt: any) => {
          if (opt.text && opt.text.trim()) {
            const regex = new RegExp(`\\b${escapeRegExp(opt.text.trim())}\\b`, 'i');
            if (regex.test(newText)) {
              newText = newText.replace(regex, `<u>${opt.text.trim()}</u>`);
              anyReplaced = true;
            }
          }
        });

        if (anyReplaced) {
          await client.query(`UPDATE questions SET question_text = $1 WHERE id = $2`, [newText, q.id]);
          updatedCount++;
          console.log(`Updated Q${q.id}`);
        }
      }
    }
    console.log(`Successfully updated ${updatedCount} questions!`);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixTest3();

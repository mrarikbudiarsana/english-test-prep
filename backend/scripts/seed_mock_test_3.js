const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const testId = '89368577-7101-4081-af73-d92bcd48b779';

    // 1. Update test
    await client.query(`
      UPDATE tests 
      SET 
        title = 'Mock Test 3',
        description = 'Full-length TOEFL ITP mock test. Includes Listening Comprehension (50 questions), Structure & Written Expression (40 questions), and Reading Comprehension (50 questions).',
        is_published = true,
        duration_minutes = 115,
        updated_at = NOW()
      WHERE id = $1
    `, [testId]);

    // 2. Remove existing questions and sections
    const oldSections = await client.query('SELECT id FROM sections WHERE test_id = $1', [testId]);
    for (const s of oldSections.rows) {
      await client.query('DELETE FROM questions WHERE section_id = $1', [s.id]);
    }
    await client.query('DELETE FROM sections WHERE test_id = $1', [testId]);
    console.log(`Cleared existing sections for Test ${testId}`);

    // Load JSON data
    const listeningJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scratch_docs/Practice_Test_3_Complete.json'), 'utf-8'));
    const structureJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scratch_docs/Practice_3_Structure_Complete.json'), 'utf-8'));
    const readingJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scratch_docs/Practice_3_Reading_Complete.json'), 'utf-8'));

    // 3. Insert Listening Sections
    // Section 1: Part A
    const partAQuestions = listeningJson.parts[0].questions;
    const sec1Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, created_at, updated_at)
      VALUES ($1, $2, 'listening', 1, 1, 'Part A - Short Conversations', 17, 'In Part A, you will hear short conversations between two people. After each conversation, you will hear a question about the conversation. The conversations and questions will not be repeated. After you hear a question, read the four possible answers in your test book and choose the best answer.', NOW(), NOW())
    `, [sec1Id, testId]);

    for (const q of partAQuestions) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, NOW(), NOW())
      `, [
        uuidv4(),
        sec1Id,
        q.number,
        q.question,
        JSON.stringify({
          part: 'A',
          options: qOptions,
          transcript: q.transcript
        }),
        JSON.stringify({ answer: q.correct_answer }),
        q.explanation
      ]);
    }
    console.log(`Inserted Part A: 30 questions`);

    // Section 2 & 3: Part B
    const partBRecordings = listeningJson.parts[1].recordings;
    const partBQuestions = listeningJson.parts[1].questions;

    // Conv 1 (31-34)
    const sec2Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_text, created_at, updated_at)
      VALUES ($1, $2, 'listening', 2, 2, 'Part B - Conversation 1', 4, 'In Part B, you will hear longer conversations. After each conversation, you will hear several questions. The conversations and questions will not be repeated. After you hear a question, read the four possible answers in your test book and choose the best answer.', $3, NOW(), NOW())
    `, [sec2Id, testId, partBRecordings[0].transcript]);

    for (const q of partBQuestions.filter(q => q.recording_id === 'B1')) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, NOW(), NOW())
      `, [
        uuidv4(),
        sec2Id,
        q.number,
        q.question,
        JSON.stringify({
          part: 'B',
          options: qOptions,
          recording_id: 'B1',
          transcript: partBRecordings[0].transcript
        }),
        JSON.stringify({ answer: q.correct_answer }),
        q.explanation
      ]);
    }

    // Conv 2 (35-38)
    const sec3Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_text, created_at, updated_at)
      VALUES ($1, $2, 'listening', 3, 2, 'Part B - Conversation 2', 4, 'In Part B, you will hear longer conversations. After each conversation, you will hear several questions. The conversations and questions will not be repeated. After you hear a question, read the four possible answers in your test book and choose the best answer.', $3, NOW(), NOW())
    `, [sec3Id, testId, partBRecordings[1].transcript]);

    for (const q of partBQuestions.filter(q => q.recording_id === 'B2')) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, NOW(), NOW())
      `, [
        uuidv4(),
        sec3Id,
        q.number,
        q.question,
        JSON.stringify({
          part: 'B',
          options: qOptions,
          recording_id: 'B2',
          transcript: partBRecordings[1].transcript
        }),
        JSON.stringify({ answer: q.correct_answer }),
        q.explanation
      ]);
    }
    console.log(`Inserted Part B: 8 questions across 2 conversations`);

    // Section 4, 5, 6: Part C
    const partCRecordings = listeningJson.parts[2].recordings;
    const partCQuestions = listeningJson.parts[2].questions;

    const talkConfigs = [
      { id: 'C1', order: 4, title: 'Part C - Talk 1', duration: 3, recIdx: 0 },
      { id: 'C2', order: 5, title: 'Part C - Talk 2', duration: 3, recIdx: 1 },
      { id: 'C3', order: 6, title: 'Part C - Talk 3', duration: 4, recIdx: 2 }
    ];

    for (const tc of talkConfigs) {
      const secId = uuidv4();
      const rec = partCRecordings[tc.recIdx];
      await client.query(`
        INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_text, created_at, updated_at)
        VALUES ($1, $2, 'listening', $3, 3, $4, $5, 'In Part C, you will hear several short talks. After each talk, you will hear some questions. The talks and questions will not be repeated. After you hear a question, read the four possible answers in your test book and choose the best answer.', $6, NOW(), NOW())
      `, [secId, testId, tc.order, tc.title, tc.duration, rec.transcript]);

      for (const q of partCQuestions.filter(q => q.recording_id === tc.id)) {
        const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
        await client.query(`
          INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, created_at, updated_at)
          VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, NOW(), NOW())
        `, [
          uuidv4(),
          secId,
          q.number,
          q.question,
          JSON.stringify({
            part: 'C',
            options: qOptions,
            recording_id: tc.id,
            transcript: rec.transcript
          }),
          JSON.stringify({ answer: q.correct_answer }),
          q.explanation
        ]);
      }
    }
    console.log(`Inserted Part C: 12 questions across 3 talks`);

    // 4. Insert Structure Section (Order 7)
    const sec7Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, created_at, updated_at)
      VALUES ($1, $2, 'structure', 7, null, 'Structure and Written Expression', 25, 'This section is designed to measure your ability to recognize language that is appropriate for standard written English. There are two types of questions in this section, with special directions for each type.', NOW(), NOW())
    `, [sec7Id, testId]);

    // Structure 1-15
    for (const q of structureJson.sections[0].questions) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      let explText = q.explanation;
      if (q.other_options_explanation) {
        explText += `\n\nOther options: ${q.other_options_explanation}`;
      }
      if (q.completed_sentence) {
        explText += `\n\nCompleted sentence: ${q.completed_sentence}`;
      }
      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, NOW(), NOW())
      `, [
        uuidv4(),
        sec7Id,
        q.number,
        q.stem,
        JSON.stringify({
          part: 'A',
          options: qOptions
        }),
        JSON.stringify({ answer: q.correct_answer }),
        explText
      ]);
    }

    // Written Expression 16-40
    for (const q of structureJson.sections[1].questions) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      // Replace [A] ... with <u>...</u>
      // q.labeled_sentence has " [A] ... [B] ... [C] ... [D] ..."
      // We can reconstruct with <u>...</u> using segments
      let underlinedText = '';
      if (q.segments && q.segments.length > 0) {
        underlinedText = q.segments.map(seg => {
          if (seg.label) {
            return `<u>${seg.text}</u>`;
          }
          return seg.text;
        }).join(' ').replace(/\s+/g, ' ').trim();
      } else {
        underlinedText = q.labeled_sentence;
      }

      let explText = q.explanation;
      if (q.correction && q.correction.original) {
        explText += `\n\nCorrection: ${q.correction.original} -> ${q.correction.replacement}`;
      }
      if (q.corrected_sentence) {
        explText += `\n\nCorrected sentence: ${q.corrected_sentence}`;
      }

      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, NOW(), NOW())
      `, [
        uuidv4(),
        sec7Id,
        q.number,
        underlinedText,
        JSON.stringify({
          part: 'B',
          options: qOptions
        }),
        JSON.stringify({ answer: q.correct_answer }),
        explText
      ]);
    }
    console.log(`Inserted Structure & Written Expression: 40 questions`);

    // 5. Insert Reading Sections (Order 8 to 12)
    for (let pIdx = 0; pIdx < readingJson.passages.length; pIdx++) {
      const passage = readingJson.passages[pIdx];
      const secOrder = 8 + pIdx;
      const secTitle = `Reading Passage ${pIdx + 1}`;
      const secId = uuidv4();
      const fullPassageText = passage.paragraphs.map(p => `[${p.number}] ${p.text}`).join('\n\n');

      await client.query(`
        INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_title, passage_text, created_at, updated_at)
        VALUES ($1, $2, 'reading', $3, null, $4, 11, 'Directions: In this section you will read several passages. Each one is followed by a number of questions about it. For questions 1-50, you are to choose the one best answer, (A), (B), (C), or (D), to each question. Then, on your answer sheet, find the number of the question and fill in the space that corresponds to the letter of the answer you have chosen. Answer all questions about the information in a passage on the basis of what is stated or implied in that passage.', $5, $6, NOW(), NOW())
      `, [secId, testId, secOrder, secTitle, passage.internal_topic, fullPassageText]);

      for (const q of passage.questions) {
        const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
        const explParts = Object.entries(q.option_explanations || {}).map(([k, txt]) => `${k}: ${txt}`).join('\n');
        const fullExpl = q.evidence ? `Evidence: ${q.evidence}\n\n${explParts}` : explParts;

        await client.query(`
          INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, created_at, updated_at)
          VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, NOW(), NOW())
        `, [
          uuidv4(),
          secId,
          q.number,
          q.question,
          JSON.stringify({
            options: qOptions
          }),
          JSON.stringify({ answer: q.correct_answer }),
          fullExpl
        ]);
      }
    }
    console.log(`Inserted 5 Reading Passages: 50 questions`);

    await client.query('COMMIT');
    console.log(`\n🎉 SUCCESSFULLY SEEDED MOCK TEST 3! 12 sections and 140 questions!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding Mock Test 3:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

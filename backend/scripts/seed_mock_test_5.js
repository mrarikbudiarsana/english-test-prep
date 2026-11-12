const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if Mock Test 5 already exists
    const existingTest = await client.query("SELECT id FROM tests WHERE title = 'Mock Test 5'");
    let testId;

    if (existingTest.rows.length > 0) {
      testId = existingTest.rows[0].id;
      console.log(`Found existing Mock Test 5 (id: ${testId}). Cleaning up old sections/questions...`);

      const oldSections = await client.query('SELECT id FROM sections WHERE test_id = $1', [testId]);
      for (const s of oldSections.rows) {
        await client.query('DELETE FROM questions WHERE section_id = $1', [s.id]);
      }
      await client.query('DELETE FROM sections WHERE test_id = $1', [testId]);

      await client.query(`
        UPDATE tests 
        SET 
          description = 'Full-length TOEFL ITP mock test. Includes Listening Comprehension (50 questions), Structure & Written Expression (40 questions), and Reading Comprehension (50 questions).',
          is_published = false,
          is_free = false,
          duration_minutes = 115,
          updated_at = NOW()
        WHERE id = $1
      `, [testId]);
    } else {
      testId = uuidv4();
      console.log(`Creating new Mock Test 5 (id: ${testId})...`);
      
      // Get an admin user for created_by
      const adminUser = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      const createdBy = adminUser.rows.length > 0 ? adminUser.rows[0].id : null;

      await client.query(`
        INSERT INTO tests (id, title, description, test_type, is_published, is_free, duration_minutes, created_by, delivery_model, audio_thinking_time, created_at, updated_at)
        VALUES ($1, 'Mock Test 5', 'Full-length TOEFL ITP mock test. Includes Listening Comprehension (50 questions), Structure & Written Expression (40 questions), and Reading Comprehension (50 questions).', 'toefl_itp', false, false, 115, $2, 'legacy', 0, NOW(), NOW())
      `, [testId, createdBy]);
    }

    // Load parsed JSON data
    const listeningJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch_docs/Practice_5_Listening_Complete.json'), 'utf-8'));
    const structureJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch_docs/Practice_5_Structure_Complete.json'), 'utf-8'));
    const readingJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch_docs/Practice_5_Reading_Complete.json'), 'utf-8'));

    // --- 1. INSERT LISTENING SECTIONS ---

    // Section 1: Part A (Short Conversations, Q1-30)
    const partAQuestions = listeningJson.parts[0].questions;
    const sec1Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, audio_url, created_at, updated_at)
      VALUES ($1, $2, 'listening', 1, 1, 'Part A - Short Conversations', 17, 'In Part A, you will hear short conversations between two people. After each conversation, you will hear a question about the conversation. The conversations and questions will not be repeated. After you hear a question, read the four possible answers and choose the best answer.', null, NOW(), NOW())
    `, [sec1Id, testId]);

    for (const q of partAQuestions) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, audio_url, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, $8, NOW(), NOW())
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
        q.explanation,
        q.audio_url
      ]);
    }
    console.log(`Inserted Part A: 30 questions with audio`);

    // Section 2 & 3: Part B
    const partBRecordings = listeningJson.parts[1].recordings;
    const partBQuestions = listeningJson.parts[1].questions;

    // Conv 1 (31-34)
    const sec2Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_text, audio_url, created_at, updated_at)
      VALUES ($1, $2, 'listening', 2, 2, 'Part B - Conversation 1', 4, 'In Part B, you will hear longer conversations. After each conversation, you will hear several questions. The conversations and questions will not be repeated. Choose the best answer to each question.', $3, $4, NOW(), NOW())
    `, [sec2Id, testId, partBRecordings[0].transcript, partBRecordings[0].audio_url]);

    for (const q of partBQuestions.filter(q => q.recording_id === 'B1')) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, audio_url, group_label, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, $8, 'Questions 31-34', NOW(), NOW())
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
        q.explanation,
        q.audio_url
      ]);
    }

    // Conv 2 (35-38)
    const sec3Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_text, audio_url, created_at, updated_at)
      VALUES ($1, $2, 'listening', 3, 2, 'Part B - Conversation 2', 4, 'In Part B, you will hear longer conversations. After each conversation, you will hear several questions. Choose the best answer to each question.', $3, $4, NOW(), NOW())
    `, [sec3Id, testId, partBRecordings[1].transcript, partBRecordings[1].audio_url]);

    for (const q of partBQuestions.filter(q => q.recording_id === 'B2')) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, audio_url, group_label, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, $8, 'Questions 35-38', NOW(), NOW())
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
        q.explanation,
        q.audio_url
      ]);
    }
    console.log(`Inserted Part B: 8 questions across 2 conversations with audio`);

    // Section 4, 5, 6: Part C (Short Talks)
    const partCRecordings = listeningJson.parts[2].recordings;
    const partCQuestions = listeningJson.parts[2].questions;

    const talkConfigs = [
      { id: 'C1', order: 4, title: 'Part C - Talk 1', duration: 3, recIdx: 0, group: 'Questions 39-42' },
      { id: 'C2', order: 5, title: 'Part C - Talk 2', duration: 3, recIdx: 1, group: 'Questions 43-46' },
      { id: 'C3', order: 6, title: 'Part C - Talk 3', duration: 4, recIdx: 2, group: 'Questions 47-50' }
    ];

    for (const tc of talkConfigs) {
      const secId = uuidv4();
      const rec = partCRecordings[tc.recIdx];
      await client.query(`
        INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_text, audio_url, created_at, updated_at)
        VALUES ($1, $2, 'listening', $3, 3, $4, $5, 'In Part C, you will hear several short talks. After each talk, you will hear some questions. Choose the best answer to each question.', $6, $7, NOW(), NOW())
      `, [secId, testId, tc.order, tc.title, tc.duration, rec.transcript, rec.audio_url]);

      for (const q of partCQuestions.filter(q => q.recording_id === tc.id)) {
        const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
        await client.query(`
          INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, audio_url, group_label, created_at, updated_at)
          VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, $8, $9, NOW(), NOW())
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
          q.explanation,
          rec.audio_url,
          tc.group
        ]);
      }
    }
    console.log(`Inserted Part C: 12 questions across 3 talks with audio`);

    // --- 2. INSERT STRUCTURE AND WRITTEN EXPRESSION (Order 7) ---
    const sec7Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, created_at, updated_at)
      VALUES ($1, $2, 'structure', 7, null, 'Structure and Written Expression', 25, 'This section is designed to measure your ability to recognize language that is appropriate for standard written English. Questions 1–15 are incomplete sentences. Beneath each sentence you will see four words or phrases, marked (A), (B), (C), and (D). Choose the one word or phrase that best completes the sentence.\n\nQuestions 16–40 have four underlined words or phrases. The four underlined parts of the sentence are marked (A), (B), (C), and (D). Identify the one underlined word or phrase that must be changed in order for the sentence to be correct.', NOW(), NOW())
    `, [sec7Id, testId]);

    // Structure 1-15
    for (const q of structureJson.sections[0].questions) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
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
        q.explanation
      ]);
    }

    // Written Expression 16-40
    for (const q of structureJson.sections[1].questions) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, NOW(), NOW())
      `, [
        uuidv4(),
        sec7Id,
        q.number,
        q.underlined_text,
        JSON.stringify({
          part: 'B',
          options: qOptions
        }),
        JSON.stringify({ answer: q.correct_answer }),
        q.explanation
      ]);
    }
    console.log(`Inserted Structure & Written Expression: 40 questions`);

    // --- 3. INSERT READING SECTIONS (Order 8 to 12) ---
    for (let pIdx = 0; pIdx < readingJson.passages.length; pIdx++) {
      const passage = readingJson.passages[pIdx];
      const secOrder = 8 + pIdx;
      const secTitle = `Reading Passage ${pIdx + 1}`;
      const secId = uuidv4();
      const groupLabel = `Questions ${pIdx * 10 + 1}-${pIdx * 10 + 10}`;

      await client.query(`
        INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_title, passage_text, created_at, updated_at)
        VALUES ($1, $2, 'reading', $3, null, $4, 11, 'Directions: In this section you will read several passages. Each one is followed by a number of questions about it. You are to choose the one best answer, (A), (B), (C), or (D), to each question.', $5, $6, NOW(), NOW())
      `, [secId, testId, secOrder, secTitle, passage.internal_topic, passage.full_text]);

      for (const q of passage.questions) {
        const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));

        await client.query(`
          INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, group_label, created_at, updated_at)
          VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, $8, NOW(), NOW())
        `, [
          uuidv4(),
          secId,
          q.number,
          q.question,
          JSON.stringify({
            options: qOptions
          }),
          JSON.stringify({ answer: q.correct_answer }),
          q.explanation,
          groupLabel
        ]);
      }
    }
    console.log(`Inserted 5 Reading Passages: 50 questions`);

    await client.query('COMMIT');
    console.log(`\n🎉 SUCCESSFULLY CREATED & SEEDED MOCK TEST 5!`);
    console.log(`Test ID: ${testId}`);
    console.log(`Published Status: false (Unpublished as requested)`);
    console.log(`Sections: 12 sections`);
    console.log(`Questions: 140 questions (50 Listening + 40 Structure/Written Expression + 50 Reading)`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding Mock Test 5:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

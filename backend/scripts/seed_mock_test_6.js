const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const AUDIO_URLS = {
  // Part A (Questions 1-30)
  1: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630819/Practice_6_Part_A_Question_01_kfpdb8.mp3',
  2: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630819/Practice_6_Part_A_Question_02_niehyy.mp3',
  3: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630809/Practice_6_Part_A_Question_03_medmby.mp3',
  4: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630818/Practice_6_Part_A_Question_04_jt9oxl.mp3',
  5: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630808/Practice_6_Part_A_Question_05_dullwh.mp3',
  6: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630808/Practice_6_Part_A_Question_06_cpgixt.mp3',
  7: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630808/Practice_6_Part_A_Question_07_ktztza.mp3',
  8: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630808/Practice_6_Part_A_Question_08_cwajfw.mp3',
  9: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630807/Practice_6_Part_A_Question_09_pihcap.mp3',
  10: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630794/Practice_6_Part_A_Question_10_qzprqr.mp3',
  11: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630807/Practice_6_Part_A_Question_11_zyrmro.mp3',
  12: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630794/Practice_6_Part_A_Question_12_ddbqwy.mp3',
  13: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630794/Practice_6_Part_A_Question_13_tlitqz.mp3',
  14: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630793/Practice_6_Part_A_Question_14_w0vqrf.mp3',
  15: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630793/Practice_6_Part_A_Question_15_gd9apm.mp3',
  16: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630793/Practice_6_Part_A_Question_16_eacy02.mp3',
  17: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630793/Practice_6_Part_A_Question_17_etgpai.mp3',
  18: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630793/Practice_6_Part_A_Question_18_q3bjkp.mp3',
  19: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630793/Practice_6_Part_A_Question_19_oeqmxp.mp3',
  20: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630793/Practice_6_Part_A_Question_20_svz2cc.mp3',
  21: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630792/Practice_6_Part_A_Question_21_iivemz.mp3',
  22: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630793/Practice_6_Part_A_Question_22_jezakn.mp3',
  23: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630792/Practice_6_Part_A_Question_23_hmgtko.mp3',
  24: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630791/Practice_6_Part_A_Question_24_fdldfb.mp3',
  25: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630792/Practice_6_Part_A_Question_25_otrypy.mp3',
  26: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630792/Practice_6_Part_A_Question_26_xh9u7y.mp3',
  27: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630792/Practice_6_Part_A_Question_27_d7hkjx.mp3',
  28: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630792/Practice_6_Part_A_Question_28_q2bjg1.mp3',
  29: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630792/Practice_6_Part_A_Question_29_lawaho.mp3',
  30: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630791/Practice_6_Part_A_Question_30_s4zfrt.mp3',
  // Part B
  B01: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630820/Practice_6_Part_B_Questions_31-34_if0p3j.mp3',
  B02: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630822/Practice_6_Part_B_Questions_35-38_tqir4i.mp3',
  // Part C
  C01: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630821/Practice_6_Part_C_Questions_39-42_lrsijx.mp3',
  C02: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630821/Practice_6_Part_C_Questions_43-46_q2u5oi.mp3',
  C03: 'https://res.cloudinary.com/english-tests-platform/video/upload/v1794630822/Practice_6_Part_C_Questions_47-50_ryrmvb.mp3'
};

function formatTranscript(rec) {
  const lines = [];
  if (rec.introduction) {
    lines.push(`Narrator: ${rec.introduction}`);
  }
  for (const entry of rec.script) {
    lines.push(`${entry.speaker}: ${entry.text}`);
  }
  return lines.join('\n');
}

function buildUnderlinedText(segments) {
  return segments
    .map((seg) => (seg.underlined ? `<u>${seg.text}</u>` : seg.text))
    .join('');
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingTest = await client.query("SELECT id FROM tests WHERE title = 'Mock Test 6'");
    let testId;

    if (existingTest.rows.length > 0) {
      testId = existingTest.rows[0].id;
      console.log(`Found existing Mock Test 6 (id: ${testId}). Cleaning up old sections/questions...`);

      const oldSections = await client.query('SELECT id FROM sections WHERE test_id = $1', [testId]);
      for (const s of oldSections.rows) {
        await client.query('DELETE FROM questions WHERE section_id = $1', [s.id]);
      }
      await client.query('DELETE FROM sections WHERE test_id = $1', [testId]);

      await client.query(`
        UPDATE tests
        SET
          description = 'Full-length TOEFL ITP mock test. Includes Listening Comprehension (50 questions), Structure & Written Expression (40 questions), and Reading Comprehension (50 questions).',
          is_published = true,
          is_free = false,
          duration_minutes = 115,
          updated_at = NOW()
        WHERE id = $1
      `, [testId]);
    } else {
      testId = uuidv4();
      console.log(`Creating new Mock Test 6 (id: ${testId})...`);

      const adminUser = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      const createdBy = adminUser.rows.length > 0 ? adminUser.rows[0].id : null;

      await client.query(`
        INSERT INTO tests (id, title, description, test_type, is_published, is_free, duration_minutes, created_by, delivery_model, audio_thinking_time, created_at, updated_at)
        VALUES ($1, 'Mock Test 6', 'Full-length TOEFL ITP mock test. Includes Listening Comprehension (50 questions), Structure & Written Expression (40 questions), and Reading Comprehension (50 questions).', 'toefl_itp', true, false, 115, $2, 'legacy', 0, NOW(), NOW())
      `, [testId, createdBy]);
    }

    const listeningJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch_docs/Practice_6_Listening_Complete.json'), 'utf-8'));
    const structureJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch_docs/Practice_6_Structure_Complete.json'), 'utf-8'));
    const readingJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch_docs/Practice_6_Reading_Complete.json'), 'utf-8'));

    // --- 1. INSERT LISTENING SECTIONS ---
    // Section 1: Part A (Short Conversations, Q1-30)
    const partARecordings = listeningJson.parts[0].recordings;
    const sec1Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, audio_url, created_at, updated_at)
      VALUES ($1, $2, 'listening', 1, 1, 'Part A - Short Conversations', 17, 'In Part A, you will hear short conversations between two people. After each conversation, you will hear a question about the conversation. The conversations and questions will not be repeated. After you hear a question, read the four possible answers and choose the best answer.', null, NOW(), NOW())
    `, [sec1Id, testId]);

    for (const rec of partARecordings) {
      const q = rec.questions[0];
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      const transcript = formatTranscript(rec);
      const audioUrl = AUDIO_URLS[q.number];
      if (!audioUrl) throw new Error(`Missing audio URL for Part A Q${q.number}`);

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
          transcript
        }),
        JSON.stringify({ answer: q.correct_answer }),
        q.explanation,
        audioUrl
      ]);
    }
    console.log('Inserted Part A: 30 questions with audio');

    // Section 2 & 3: Part B (Extended Conversations)
    const partBRecordings = listeningJson.parts[1].recordings;
    const partBConfigs = [
      { recIdx: 0, order: 2, title: 'Part B - Conversation 1', group: 'Questions 31-34' },
      { recIdx: 1, order: 3, title: 'Part B - Conversation 2', group: 'Questions 35-38' }
    ];

    for (const cfg of partBConfigs) {
      const rec = partBRecordings[cfg.recIdx];
      const transcript = formatTranscript(rec);
      const audioUrl = AUDIO_URLS[rec.recording_id];
      if (!audioUrl) throw new Error(`Missing audio URL for ${rec.recording_id}`);

      const secId = uuidv4();
      await client.query(`
        INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_text, audio_url, created_at, updated_at)
        VALUES ($1, $2, 'listening', $3, 2, $4, 4, 'In Part B, you will hear longer conversations. After each conversation, you will hear several questions. The conversations and questions will not be repeated. Choose the best answer to each question.', $5, $6, NOW(), NOW())
      `, [secId, testId, cfg.order, cfg.title, transcript, audioUrl]);

      for (const q of rec.questions) {
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
            part: 'B',
            options: qOptions,
            recording_id: rec.recording_id,
            transcript
          }),
          JSON.stringify({ answer: q.correct_answer }),
          q.explanation,
          audioUrl,
          cfg.group
        ]);
      }
    }
    console.log('Inserted Part B: 8 questions across 2 conversations with audio');

    // Section 4, 5, 6: Part C (Short Talks)
    const partCRecordings = listeningJson.parts[2].recordings;
    const partCConfigs = [
      { recIdx: 0, order: 4, title: 'Part C - Talk 1', duration: 3, group: 'Questions 39-42' },
      { recIdx: 1, order: 5, title: 'Part C - Talk 2', duration: 3, group: 'Questions 43-46' },
      { recIdx: 2, order: 6, title: 'Part C - Talk 3', duration: 4, group: 'Questions 47-50' }
    ];

    for (const cfg of partCConfigs) {
      const rec = partCRecordings[cfg.recIdx];
      const transcript = formatTranscript(rec);
      const audioUrl = AUDIO_URLS[rec.recording_id];
      if (!audioUrl) throw new Error(`Missing audio URL for ${rec.recording_id}`);

      const secId = uuidv4();
      await client.query(`
        INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_text, audio_url, created_at, updated_at)
        VALUES ($1, $2, 'listening', $3, 3, $4, $5, 'In Part C, you will hear several short talks. After each talk, you will hear some questions. Choose the best answer to each question.', $6, $7, NOW(), NOW())
      `, [secId, testId, cfg.order, cfg.title, cfg.duration, transcript, audioUrl]);

      for (const q of rec.questions) {
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
            recording_id: rec.recording_id,
            transcript
          }),
          JSON.stringify({ answer: q.correct_answer }),
          q.explanation,
          audioUrl,
          cfg.group
        ]);
      }
    }
    console.log('Inserted Part C: 12 questions across 3 talks with audio');

    // --- 2. INSERT STRUCTURE AND WRITTEN EXPRESSION (Order 7) ---
    const sec7Id = uuidv4();
    await client.query(`
      INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, created_at, updated_at)
      VALUES ($1, $2, 'structure', 7, null, 'Structure and Written Expression', 25, 'This section is designed to measure your ability to recognize language that is appropriate for standard written English. Questions 1–15 are incomplete sentences. Beneath each sentence you will see four words or phrases, marked (A), (B), (C), and (D). Choose the one word or phrase that best completes the sentence.\n\nQuestions 16–40 have four underlined words or phrases. The four underlined parts of the sentence are marked (A), (B), (C), and (D). Identify the one underlined word or phrase that must be changed in order for the sentence to be correct.', NOW(), NOW())
    `, [sec7Id, testId]);

    for (const q of structureJson.questions) {
      const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
      const isStructure = q.section === 'Structure';
      const questionText = isStructure ? q.stem : buildUnderlinedText(q.segments);
      const explanation = isStructure
        ? `Target: ${q.grammar_target}\n${q.explanation}\nCompleted sentence: ${q.corrected_sentence}\nOther options: ${q.distractor_explanations}`
        : `Target: ${q.grammar_target}\nCorrection: "${q.correction.original}" → "${q.correction.replacement}"\n${q.explanation}\nCorrected sentence: ${q.corrected_sentence}`;

      await client.query(`
        INSERT INTO questions (id, section_id, question_number, question_type, question_text, question_data, correct_answer, points, explanation, created_at, updated_at)
        VALUES ($1, $2, $3, 'multiple_choice', $4, $5, $6, 1, $7, NOW(), NOW())
      `, [
        uuidv4(),
        sec7Id,
        q.number,
        questionText,
        JSON.stringify({
          part: isStructure ? 'A' : 'B',
          options: qOptions
        }),
        JSON.stringify({ answer: q.correct_answer }),
        explanation
      ]);
    }
    console.log('Inserted Structure & Written Expression: 40 questions');

    // --- 3. INSERT READING SECTIONS (Order 8 to 12) ---
    for (let pIdx = 0; pIdx < readingJson.passages.length; pIdx++) {
      const passage = readingJson.passages[pIdx];
      const secOrder = 8 + pIdx;
      const secTitle = `Reading Passage ${pIdx + 1}`;
      const secId = uuidv4();
      const groupLabel = `Questions ${pIdx * 10 + 1}-${pIdx * 10 + 10}`;
      const fullText = passage.paragraphs.map((p) => `[${p.number}]  ${p.text}`).join('\n\n');

      await client.query(`
        INSERT INTO sections (id, test_id, section_type, section_order, part_number, title, duration_minutes, instructions, passage_title, passage_text, created_at, updated_at)
        VALUES ($1, $2, 'reading', $3, null, $4, 11, 'Directions: In this section you will read several passages. Each one is followed by a number of questions about it. You are to choose the one best answer, (A), (B), (C), or (D), to each question.', $5, $6, NOW(), NOW())
      `, [secId, testId, secOrder, secTitle, passage.title, fullText]);

      for (const q of passage.questions) {
        const qOptions = Object.entries(q.options).map(([k, text]) => ({ key: k, text }));
        const optExp = Object.entries(q.option_explanations)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' ');
        const explanation = `${q.id}  |  ${q.question_type}  |  Intended difficulty ${q.intended_difficulty}\nEvidence: ${q.evidence}\n${optExp}`;

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
          explanation,
          groupLabel
        ]);
      }
    }
    console.log('Inserted 5 Reading Passages: 50 questions');

    await client.query('COMMIT');
    console.log('\n🎉 SUCCESSFULLY CREATED & SEEDED MOCK TEST 6!');
    console.log(`Test ID: ${testId}`);
    console.log('Published Status: true');
    console.log('Sections: 12 sections');
    console.log('Questions: 140 questions (50 Listening + 40 Structure/Written Expression + 50 Reading)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding Mock Test 6:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

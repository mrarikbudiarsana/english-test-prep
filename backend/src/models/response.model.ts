import { query } from '../config/database';

// ---------- helpers ----------

const SELECT_COLUMNS = `
  id,
  attempt_id     AS "attemptId",
  question_id    AS "questionId",
  section_id     AS "sectionId",
  answer_data    AS "answerData",
  writing_text   AS "writingText",
  word_count     AS "wordCount",
  audio_url      AS "audioUrl",
  audio_duration AS "audioDuration",
  is_correct     AS "isCorrect",
  score,
  ai_feedback    AS "aiFeedback",
  answered_at    AS "answeredAt",
  created_at     AS "createdAt"
`;

// ---------- queries ----------

export async function findByAttemptId(attemptId: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM responses
     WHERE attempt_id = $1
     ORDER BY answered_at ASC`,
    [attemptId],
  );
  return result.rows;
}

export async function findByAttemptAndSection(attemptId: string, sectionId: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM responses
     WHERE attempt_id = $1 AND section_id = $2
     ORDER BY answered_at ASC`,
    [attemptId, sectionId],
  );
  return result.rows;
}

export async function findByAttemptAndQuestion(attemptId: string, questionId: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM responses
     WHERE attempt_id = $1 AND question_id = $2`,
    [attemptId, questionId],
  );
  return result.rows[0] || null;
}

export async function upsert(data: {
  attemptId: string;
  questionId: string;
  sectionId: string;
  answerData: any;
  writingText?: string;
  wordCount?: number;
  audioUrl?: string;
  audioDuration?: number;
}) {
  const result = await query(
    `INSERT INTO responses (
       attempt_id, question_id, section_id, answer_data,
       writing_text, word_count, audio_url, audio_duration
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (attempt_id, question_id) DO UPDATE SET
       answer_data    = EXCLUDED.answer_data,
       writing_text   = EXCLUDED.writing_text,
       word_count     = EXCLUDED.word_count,
       audio_url      = EXCLUDED.audio_url,
       audio_duration = EXCLUDED.audio_duration,
       answered_at    = NOW()
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.attemptId,
      data.questionId,
      data.sectionId,
      JSON.stringify(data.answerData),
      data.writingText ?? null,
      data.wordCount ?? null,
      data.audioUrl ?? null,
      data.audioDuration ?? null,
    ],
  );
  return result.rows[0];
}

export async function batchUpsert(
  responses: Array<{
    attemptId: string;
    questionId: string;
    sectionId: string;
    answerData: any;
    writingText?: string;
    wordCount?: number;
    audioUrl?: string;
    audioDuration?: number;
  }>,
) {
  if (responses.length === 0) return [];

  // If only one response, use the single upsert for simplicity
  if (responses.length === 1) {
    const row = await upsert(responses[0]);
    return [row];
  }

  // Build a single multi-row INSERT ... ON CONFLICT query
  const values: any[] = [];
  const rowPlaceholders: string[] = [];

  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    const offset = i * 8;
    rowPlaceholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`,
    );
    values.push(
      r.attemptId,
      r.questionId,
      r.sectionId,
      JSON.stringify(r.answerData),
      r.writingText ?? null,
      r.wordCount ?? null,
      r.audioUrl ?? null,
      r.audioDuration ?? null,
    );
  }

  const result = await query(
    `INSERT INTO responses (
       attempt_id, question_id, section_id, answer_data,
       writing_text, word_count, audio_url, audio_duration
     )
     VALUES ${rowPlaceholders.join(', ')}
     ON CONFLICT (attempt_id, question_id) DO UPDATE SET
       answer_data    = EXCLUDED.answer_data,
       writing_text   = EXCLUDED.writing_text,
       word_count     = EXCLUDED.word_count,
       audio_url      = EXCLUDED.audio_url,
       audio_duration = EXCLUDED.audio_duration,
       answered_at    = NOW()
     RETURNING ${SELECT_COLUMNS}`,
    values,
  );
  return result.rows;
}

export async function updateScore(
  id: string,
  data: {
    isCorrect: boolean;
    score: number;
    aiFeedback?: any;
  },
) {
  const result = await query(
    `UPDATE responses
     SET is_correct  = $1,
         score       = $2,
         ai_feedback = $3
     WHERE id = $4
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.isCorrect,
      data.score,
      data.aiFeedback ? JSON.stringify(data.aiFeedback) : null,
      id,
    ],
  );
  return result.rows[0] || null;
}

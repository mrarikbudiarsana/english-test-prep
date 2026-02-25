import { query } from '../config/database';

// ---------- helpers ----------

export type QuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'completion'
  | 'matching'
  | 'dropdown'
  // PTE objective item types
  | 'pte_mcq_single'
  | 'pte_mcq_multiple'
  | 'pte_reading_fill_blanks_dropdown'
  | 'pte_reading_fill_blanks_drag_drop'
  | 'pte_reorder_paragraph'
  | 'pte_listening_fill_blanks'
  | 'pte_highlight_correct_summary'
  | 'pte_select_missing_word'
  | 'pte_highlight_incorrect_words'
  | 'pte_write_from_dictation';

export interface Question {
  id: string;
  sectionId: string;
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  questionData: any;
  correctAnswer: any;
  points: number;
  explanation?: string;
  groupLabel?: string;
  groupInstructions?: string;
  audioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fieldMap: Record<string, string> = {
  sectionId: 'section_id',
  questionNumber: 'question_number',
  questionType: 'question_type',
  questionText: 'question_text',
  questionData: 'question_data',
  correctAnswer: 'correct_answer',
  points: 'points',
  explanation: 'explanation',
  groupLabel: 'group_label',
  groupInstructions: 'group_instructions',
  audioUrl: 'audio_url',
  itemPayload: 'item_payload',
};

const SELECT_COLUMNS = `
  id,
  section_id       AS "sectionId",
  question_number  AS "questionNumber",
  question_type    AS "questionType",
  question_text    AS "questionText",
  question_data    AS "questionData",
  correct_answer   AS "correctAnswer",
  points,
  explanation,
  group_label      AS "groupLabel",
  group_instructions AS "groupInstructions",
  audio_url        AS "audioUrl",
  item_payload     AS "itemPayload",
  created_at       AS "createdAt",
  updated_at       AS "updatedAt"
`;

// ---------- queries ----------

export async function findById(id: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS} FROM questions WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function findBySectionId(sectionId: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM questions
     WHERE section_id = $1
     ORDER BY question_number ASC`,
    [sectionId],
  );
  return result.rows;
}

export async function findByTestId(testId: string) {
  const result = await query(
    `SELECT q.id,
            q.section_id       AS "sectionId",
            q.question_number  AS "questionNumber",
            q.question_type    AS "questionType",
            q.question_text    AS "questionText",
            q.question_data    AS "questionData",
            q.correct_answer   AS "correctAnswer",
            q.points,
            q.explanation,
            q.group_label      AS "groupLabel",
            q.group_instructions AS "groupInstructions",
            q.audio_url        AS "audioUrl",
            q.created_at       AS "createdAt",
            q.updated_at       AS "updatedAt",
            s.section_type     AS "sectionType",
            s.section_order    AS "sectionOrder"
     FROM questions q
     JOIN sections s ON s.id = q.section_id
     WHERE s.test_id = $1
     ORDER BY s.section_order ASC, q.question_number ASC`,
    [testId],
  );
  return result.rows;
}

export async function create(data: {
  sectionId: string;
  questionNumber: number;
  questionType: string;
  questionText: string;
  questionData: any;
  correctAnswer: any;
  points?: number;
  explanation?: string;
  groupLabel?: string;
  groupInstructions?: string;
  audioUrl?: string;
  itemPayload?: any;
}) {
  const result = await query(
    `INSERT INTO questions (
       section_id, question_number, question_type,
       question_text, question_data, correct_answer,
       points, explanation, group_label, group_instructions, audio_url,
       item_payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.sectionId,
      data.questionNumber,
      data.questionType,
      data.questionText,
      JSON.stringify(data.questionData),
      JSON.stringify(data.correctAnswer),
      data.points ?? 1,
      data.explanation ?? null,
      data.groupLabel ?? null,
      data.groupInstructions ?? null,
      data.audioUrl ?? null,
      data.itemPayload != null ? JSON.stringify(data.itemPayload) : null,
    ],
  );
  return result.rows[0];
}

export async function update(
  id: string,
  data: Partial<{
    questionNumber: number;
    questionType: string;
    questionText: string;
    questionData: any;
    correctAnswer: any;
    points: number;
    explanation: string;
    groupLabel: string;
    groupInstructions: string;
    audioUrl: string;
    itemPayload: any;
  }>,
) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findById(id);

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of entries) {
    const column = fieldMap[key];
    if (!column) continue;
    const finalValue =
      (key === 'questionData' || key === 'correctAnswer' || key === 'itemPayload') && value !== null
        ? JSON.stringify(value)
        : value;
    setClauses.push(`${column} = $${paramIndex}`);
    values.push(finalValue);
    paramIndex++;
  }

  if (setClauses.length === 0) return findById(id);

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE questions
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${SELECT_COLUMNS}`,
    values,
  );
  return result.rows[0] || null;
}

export async function remove(id: string) {
  const result = await query(
    'DELETE FROM questions WHERE id = $1 RETURNING id',
    [id],
  );
  return result.rowCount! > 0;
}

export async function getMaxQuestionNumber(sectionId: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM questions
     WHERE section_id = $1
     ORDER BY question_number ASC`,
    [sectionId],
  );

  const questions = result.rows;
  if (questions.length === 0) return 0;

  // Calculate the maximum "end" number accounting for multi-select questions
  const maxEnd = questions.reduce((max, q) => {
    const qData = q.questionData || {};
    const consumed = (q.questionType === 'multiple_choice' && qData.multiSelect)
      ? (qData.expectedAnswers || 2)
      : 1;
    const questionEnd = q.questionNumber + consumed - 1;
    return Math.max(max, questionEnd);
  }, 0);

  return maxEnd;
}

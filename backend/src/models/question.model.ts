import { query } from '../config/database';

// ---------- helpers ----------

const fieldMap: Record<string, string> = {
  sectionId: 'section_id',
  questionNumber: 'question_number',
  questionType: 'question_type',
  questionText: 'question_text',
  questionData: 'question_data',
  correctAnswer: 'correct_answer',
  points: 'points',
  explanation: 'explanation',
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
}) {
  const result = await query(
    `INSERT INTO questions (
       section_id, question_number, question_type,
       question_text, question_data, correct_answer,
       points, explanation
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      (key === 'questionData' || key === 'correctAnswer') && value !== null
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
    'SELECT COALESCE(MAX(question_number), 0) AS "maxNumber" FROM questions WHERE section_id = $1',
    [sectionId],
  );
  return parseInt(result.rows[0].maxNumber, 10);
}

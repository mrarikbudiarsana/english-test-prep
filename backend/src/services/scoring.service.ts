import { query } from '../config/database';
import { SectionType } from '../models/section.model';
import { Question } from '../models/question.model';

type QueryLike = (text: string, params?: any[]) => Promise<{ rows: any[] }>;

// TOEFL iTP Level 1 Tables (Based on 50/40/50 questions)
// Listening (50 questions, Scale 31-68)
const TOEFL_ITP_LISTENING_TABLE = [
  { min: 50, max: 50, band: 68 },
  { min: 49, max: 49, band: 67 },
  { min: 48, max: 48, band: 66 },
  { min: 47, max: 47, band: 65 },
  { min: 45, max: 46, band: 63 },
  { min: 43, max: 44, band: 61 },
  { min: 41, max: 42, band: 59 },
  { min: 39, max: 40, band: 57 },
  { min: 37, max: 38, band: 55 },
  { min: 35, max: 36, band: 54 },
  { min: 33, max: 34, band: 52 },
  { min: 31, max: 32, band: 51 },
  { min: 29, max: 30, band: 50 },
  { min: 27, max: 28, band: 49 },
  { min: 25, max: 26, band: 48 },
  { min: 23, max: 24, band: 47 },
  { min: 21, max: 22, band: 46 },
  { min: 19, max: 20, band: 45 },
  { min: 17, max: 18, band: 44 },
  { min: 15, max: 16, band: 43 },
  { min: 13, max: 14, band: 42 },
  { min: 11, max: 12, band: 41 },
  { min: 9, max: 10, band: 39 },
  { min: 7, max: 8, band: 37 },
  { min: 5, max: 6, band: 35 },
  { min: 3, max: 4, band: 33 },
  { min: 0, max: 2, band: 31 },
];

// Structure (40 questions, Scale 31-68)
const TOEFL_ITP_STRUCTURE_TABLE = [
  { min: 40, max: 40, band: 68 },
  { min: 39, max: 39, band: 67 },
  { min: 38, max: 38, band: 65 },
  { min: 37, max: 37, band: 63 },
  { min: 36, max: 36, band: 61 },
  { min: 35, max: 35, band: 60 },
  { min: 34, max: 34, band: 58 },
  { min: 33, max: 33, band: 57 },
  { min: 32, max: 32, band: 56 },
  { min: 31, max: 31, band: 55 },
  { min: 30, max: 30, band: 54 },
  { min: 29, max: 29, band: 53 },
  { min: 28, max: 28, band: 52 },
  { min: 27, max: 27, band: 51 },
  { min: 26, max: 26, band: 50 },
  { min: 25, max: 25, band: 49 },
  { min: 24, max: 24, band: 48 },
  { min: 23, max: 23, band: 47 },
  { min: 21, max: 22, band: 46 },
  { min: 19, max: 20, band: 45 },
  { min: 17, max: 18, band: 44 },
  { min: 15, max: 16, band: 43 },
  { min: 13, max: 14, band: 41 },
  { min: 11, max: 12, band: 40 },
  { min: 9, max: 10, band: 38 },
  { min: 7, max: 8, band: 37 },
  { min: 5, max: 6, band: 35 },
  { min: 4, max: 4, band: 33 },
  { min: 0, max: 3, band: 31 },
];

// Reading (50 questions, Scale 31-67)
const TOEFL_ITP_READING_TABLE = [
  { min: 50, max: 50, band: 67 },
  { min: 49, max: 49, band: 66 },
  { min: 48, max: 48, band: 65 },
  { min: 47, max: 47, band: 63 },
  { min: 46, max: 46, band: 61 },
  { min: 45, max: 45, band: 60 },
  { min: 44, max: 44, band: 59 },
  { min: 43, max: 43, band: 58 },
  { min: 42, max: 42, band: 57 },
  { min: 41, max: 41, band: 56 },
  { min: 40, max: 40, band: 55 },
  { min: 39, max: 39, band: 54 },
  { min: 38, max: 38, band: 54 },
  { min: 37, max: 37, band: 53 },
  { min: 36, max: 36, band: 52 },
  { min: 35, max: 35, band: 52 },
  { min: 34, max: 34, band: 51 },
  { min: 33, max: 33, band: 50 },
  { min: 32, max: 32, band: 49 },
  { min: 31, max: 31, band: 48 },
  { min: 29, max: 30, band: 48 },
  { min: 26, max: 28, band: 47 },
  { min: 23, max: 25, band: 46 },
  { min: 20, max: 22, band: 44 },
  { min: 16, max: 19, band: 41 },
  { min: 12, max: 15, band: 37 },
  { min: 8, max: 11, band: 34 },
  { min: 0, max: 7, band: 31 },
];

// Helper to normalize strings for comparison (remove punctuation, lower case)
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')    // collapse whitespace
    .trim();
}

function unwrapAnswer(value: any): any {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return unwrapAnswer(JSON.parse(trimmed));
      } catch {
        // Keep original string
      }
    }
    return value;
  }

  if (value && typeof value === 'object') {
    if ('answer' in value) return unwrapAnswer((value as { answer: any }).answer);
    if ('key' in value) return (value as { key: any }).key;
    if ('value' in value) return (value as { value: any }).value;
  }
  return value;
}

function normalizeChoice(value: any): string {
  return String(unwrapAnswer(value)).trim().toUpperCase();
}

/**
 * Compare user answer vs correct answer for a single question.
 * Returns points earned (1 or 0).
 */
export function checkAnswer(
  question: Question,
  userAnswer: any,
): { points: number; isCorrect: boolean } {
  const { questionType, correctAnswer } = question;
  let isCorrect = false;
  let points = 0;
  const maxPoints = getMaxPointsForQuestion(question);

  if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
    return { points: 0, isCorrect: false };
  }

  try {
    switch (questionType) {
      case 'multiple_choice':
        isCorrect = normalizeChoice(userAnswer) === normalizeChoice(correctAnswer);
        points = isCorrect ? maxPoints : 0;
        break;

      default:
        console.warn(`Unexpected question type for strictly ITP scoring: ${questionType}`);
        isCorrect = false;
    }
  } catch (err) {
    console.error(`Error checking answer for question ${question.id}:`, err);
    isCorrect = false;
  }

  points = Math.max(0, Math.min(maxPoints, points));
  return { points, isCorrect };
}

export function getMaxPointsForQuestion(question: Question): number {
  const base = Number(question.points);
  return Number.isFinite(base) && base > 0 ? base : 1;
}

export function calculateSectionMaxRawScore(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + getMaxPointsForQuestion(q), 0);
}

function normalizeQuestionRow(row: any): Question {
  return {
    id: row.id,
    sectionId: row.sectionId ?? row.section_id,
    questionNumber: row.questionNumber ?? row.question_number,
    questionType: row.questionType ?? row.question_type,
    questionText: row.questionText ?? row.question_text,
    questionData: row.questionData ?? row.question_data ?? {},
    correctAnswer: row.correctAnswer ?? row.correct_answer,
    points: row.points,
    explanation: row.explanation ?? null,
    createdAt: row.createdAt ?? row.created_at ?? new Date(),
    updatedAt: row.updatedAt ?? row.updated_at ?? new Date(),
  };
}

/**
 * Convert raw score to scaled score (31-68) based on section type into TOEFL ITP scale.
 */
export function convertToBand(
  rawScore: number,
  sectionType: SectionType,
  _testType: string = 'toefl_itp',
  _maxRawScore: number = rawScore,
): number {
  let table: Array<{ min: number; max: number; band: number }>;

  if (sectionType === 'listening') {
    table = TOEFL_ITP_LISTENING_TABLE;
  } else if (sectionType === 'structure') {
    table = TOEFL_ITP_STRUCTURE_TABLE;
  } else if (sectionType === 'reading') {
    table = TOEFL_ITP_READING_TABLE;
  } else {
    return 31; // Default floor
  }

  const match = table.find(r => rawScore >= r.min && rawScore <= r.max);
  return match ? match.band : 31;
}

/**
 * Calculate overall score from section scaled scores.
 * TOEFL iTP Formula: (Listening + Structure + Reading) * 10 / 3
 */
export function calculateOverallBand(
  listening: number | null,
  reading: number | null,
  _writing: number | null,
  _speaking: number | null,
  structure: number | null = null,
  _testType: string = 'toefl_itp'
): number {
  const l = listening ?? 31;
  const s = structure ?? 31;
  const r = reading ?? 31;
  const total = (l + s + r) * 10 / 3;
  return Math.round(total);
}

export async function scoreObjectiveSectionWithQuery(
  queryFn: QueryLike,
  attemptId: string,
  sectionType: SectionType,
  _testType: string = 'toefl_itp',
): Promise<number> {
  const questionsResult = await queryFn(
    `SELECT q.*
     FROM questions q
     JOIN sections s ON s.id = q.section_id
     JOIN attempts a ON a.test_id = s.test_id
     WHERE a.id = $1 AND s.section_type = $2
     ORDER BY q.question_number ASC`,
    [attemptId, sectionType]
  );
  const questions = questionsResult.rows.map(normalizeQuestionRow);

  if (questions.length === 0) {
    return 31;
  }

  const responsesResult = await queryFn(
    `SELECT * FROM responses WHERE attempt_id = $1 AND section_id IN (
       SELECT id FROM sections WHERE section_type = $2
    )`,
    [attemptId, sectionType]
  );
  const responses = responsesResult.rows;

  let rawScore = 0;
  const maxRawScore = calculateSectionMaxRawScore(questions as Question[]);

  const responseUpdates: Array<{ id: string; isCorrect: boolean; points: number }> = [];

  for (const q of questions) {
    const response = responses.find(r => r.question_id === q.id);
    if (response) {
      let ans = response.answer_data ?? response.answerData;
      if (typeof ans === 'string') {
        try { ans = JSON.parse(ans); } catch { }
      }

      const { points, isCorrect } = checkAnswer(q, ans);
      if (points > 0) {
        rawScore += points;
      }

      responseUpdates.push({ id: response.id, isCorrect, points });
    }
  }

  // Batch update all responses in a single query
  if (responseUpdates.length > 0) {
    const values: any[] = [];
    const valuePlaceholders: string[] = [];
    responseUpdates.forEach((u, i) => {
      const offset = i * 3;
      valuePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      values.push(u.id, u.isCorrect, u.points);
    });

    await queryFn(
      `UPDATE responses AS r SET
         is_correct = v.is_correct,
         score = v.score
       FROM (VALUES ${valuePlaceholders.join(', ')}) AS v(id, is_correct, score)
       WHERE r.id = v.id::uuid`,
      values
    );
  }

  const scaledScore = convertToBand(rawScore, sectionType, 'toefl_itp', maxRawScore);

  // Update attempt columns strictly for ITP
  let rawCol = '';
  let scaledCol = '';

  if (sectionType === 'listening') {
    rawCol = 'listening_raw';
    scaledCol = 'listening_score';
  } else if (sectionType === 'reading') {
    rawCol = 'reading_raw';
    scaledCol = 'reading_score';
  } else if (sectionType === 'structure') {
    rawCol = 'structure_raw';
    scaledCol = 'structure_score';
  }

  if (scaledCol) {
    const updateQuery = `
      UPDATE attempts
      SET ${rawCol ? `${rawCol} = $1, ` : ''}${scaledCol} = $2
      WHERE id = $3
    `;
    const params = rawCol ? [rawScore, scaledScore, attemptId] : [scaledScore, attemptId];
    await queryFn(updateQuery, params);
  }

  return scaledScore;
}

export async function scoreObjectiveSection(attemptId: string, sectionType: SectionType, _testType: string): Promise<number> {
  return scoreObjectiveSectionWithQuery(query, attemptId, sectionType, 'toefl_itp');
}

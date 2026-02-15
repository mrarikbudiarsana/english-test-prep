import { query } from '../config/database';
import { SectionType } from '../models/section.model';
import { Question, QuestionType } from '../models/question.model';
import { TestType } from '../models/test.model';

// IELTS Band conversion tables (approximate)
const LISTENING_BAND_TABLE = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 32, max: 34, band: 7.5 },
  { min: 30, max: 31, band: 7.0 },
  { min: 26, max: 29, band: 6.5 },
  { min: 23, max: 25, band: 6.0 },
  { min: 18, max: 22, band: 5.5 },
  { min: 16, max: 17, band: 5.0 },
  { min: 13, max: 15, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 8, max: 9, band: 3.5 },
  { min: 6, max: 7, band: 3.0 },
  { min: 4, max: 5, band: 2.5 },
  { min: 0, max: 3, band: 0.0 }, // fallback
];

// Academic Reading
const READING_ACADEMIC_BAND_TABLE = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 27, max: 29, band: 6.5 },
  { min: 23, max: 26, band: 6.0 },
  { min: 19, max: 22, band: 5.5 },
  { min: 15, max: 18, band: 5.0 },
  { min: 13, max: 14, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 8, max: 9, band: 3.5 },
  { min: 6, max: 7, band: 3.0 },
  { min: 4, max: 5, band: 2.5 },
  { min: 0, max: 3, band: 0.0 },
];

// General Training Reading
const READING_GENERAL_BAND_TABLE = [
  { min: 40, max: 40, band: 9.0 },
  { min: 39, max: 39, band: 8.5 },
  { min: 37, max: 38, band: 8.0 },
  { min: 36, max: 36, band: 7.5 },
  { min: 34, max: 35, band: 7.0 },
  { min: 32, max: 33, band: 6.5 },
  { min: 30, max: 31, band: 6.0 },
  { min: 27, max: 29, band: 5.5 },
  { min: 23, max: 26, band: 5.0 },
  { min: 19, max: 22, band: 4.5 },
  { min: 15, max: 18, band: 4.0 },
  { min: 12, max: 14, band: 3.5 },
  { min: 9, max: 11, band: 3.0 },
  { min: 6, max: 8, band: 2.5 },
  { min: 0, max: 5, band: 0.0 },
];

// TOEFL iTP Level 1 Tables (Based on 50/40/50 questions)
// Listening (50 questions, Scale 31-68)
const TOEFL_ITP_LISTENING_TABLE = [
  { min: 50, max: 50, band: 68 },
  { min: 49, max: 49, band: 67 },
  { min: 48, max: 48, band: 66 },
  { min: 47, max: 47, band: 65 },
  { min: 45, max: 46, band: 63 }, // Approx
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
  { min: 41, max: 41, band: 56 }, // Approx
  { min: 40, max: 40, band: 55 },
  { min: 39, max: 39, band: 54 },
  { min: 38, max: 38, band: 54 },
  { min: 37, max: 37, band: 53 },
  { min: 36, max: 36, band: 52 },
  { min: 35, max: 35, band: 52 },
  { min: 34, max: 34, band: 51 },
  { min: 33, max: 33, band: 50 },
  { min: 32, max: 32, band: 49 },
  { min: 31, max: 31, band: 48 }, // and so on... simplifying the curve
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
    // Handle double-encoded JSON values such as "\"D\"" or "{\"answer\":\"D\"}"
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return unwrapAnswer(JSON.parse(trimmed));
      } catch {
        // Keep original string when it is not valid JSON
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

function normalizeChoiceArray(values: any[]): string[] {
  return values.map((v) => normalizeChoice(v)).sort();
}

/**
 * Compare user answer vs correct answer for a single question.
 * Returns points earned (usually 1 or 0).
 */
export function checkAnswer(
  question: Question,
  userAnswer: any,
): { points: number; isCorrect: boolean } {
  const { questionType, correctAnswer, questionData } = question;
  let isCorrect = false;

  if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
    return { points: 0, isCorrect: false };
  }

  try {
    switch (questionType) {
      case 'multiple_choice':
        isCorrect = compareMultipleChoice(userAnswer, correctAnswer);
        break;

      case 'true_false_not_given':
      case 'yes_no_not_given':
        isCorrect = String(unwrapAnswer(userAnswer)).toUpperCase() === String(unwrapAnswer(correctAnswer)).toUpperCase();
        break;

      case 'completion':
        isCorrect = compareCompletion(userAnswer, correctAnswer, questionData);
        break;

      case 'matching':
        isCorrect = compareMatching(userAnswer, correctAnswer);
        break;

      case 'dropdown':
        isCorrect = compareDropdown(userAnswer, correctAnswer);
        break;

      default:
        console.warn(`Unknown question type for auto-scoring: ${questionType}`);
        isCorrect = false;
    }
  } catch (err) {
    console.error(`Error checking answer for question ${question.id}:`, err);
    isCorrect = false;
  }

  const points = isCorrect ? (question.points || 1) : 0;
  return { points, isCorrect };
}

function compareMultipleChoice(user: any, correct: any): boolean {
  const userValue = unwrapAnswer(user);
  const correctValue = unwrapAnswer(correct);

  if (Array.isArray(correctValue)) {
    // Multi-select (e.g. "Choose TWO")
    // user should also be an array
    if (!Array.isArray(userValue)) return false;
    if (userValue.length !== correctValue.length) return false;
    const sortedUser = normalizeChoiceArray(userValue);
    const sortedCorrect = normalizeChoiceArray(correctValue);
    return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
  }
  // Single select
  return normalizeChoice(userValue) === normalizeChoice(correctValue);
}

function compareCompletion(user: any, correct: any, qData: any): boolean {
  // correct answer can be a string or array of accepted strings
  // e.g. "bus station" or ["bus station", "station"]

  const userNorm = normalizeAnswer(String(unwrapAnswer(user)));
  const correctValue = unwrapAnswer(correct);
  const acceptedAnswers = Array.isArray(correctValue) ? correctValue : [correctValue];

  return acceptedAnswers.some((ans: string) => {
    return normalizeAnswer(ans) === userNorm;
  });
}

function compareMatching(user: any, correct: any): boolean {
  // user and correct are objects: { "A": "B", "C": "D" }
  const userValue = unwrapAnswer(user);
  const correctValue = unwrapAnswer(correct);
  if (typeof userValue !== 'object' || typeof correctValue !== 'object') return false;
  const keys = Object.keys(correctValue);
  for (const key of keys) {
    if (userValue[key] !== correctValue[key]) return false;
  }
  return true;
}

function compareDropdown(user: any, correct: any): boolean {
  // similar to matching: { "blank1": "optionA", "blank2": "optionB" }
  const userValue = unwrapAnswer(user);
  const correctValue = unwrapAnswer(correct);
  if (typeof userValue !== 'object' || typeof correctValue !== 'object') return false;
  const keys = Object.keys(correctValue);
  for (const key of keys) {
    if (userValue[key] !== correctValue[key]) return false;
  }
  return true;
}

/**
 * Convert raw score to band score based on section type and test type.
 */
export function convertToBand(
  rawScore: number,
  sectionType: SectionType,
  testType: string = 'academic',
): number {
  let table: Array<{ min: number; max: number; band: number }>;

  if (testType === 'toefl_itp') {
    if (sectionType === 'listening') {
      table = TOEFL_ITP_LISTENING_TABLE;
    } else if (sectionType === 'structure') {
      table = TOEFL_ITP_STRUCTURE_TABLE;
    } else if (sectionType === 'reading') {
      table = TOEFL_ITP_READING_TABLE;
    } else {
      return 0;
    }
  } else {
    // Default to IELTS
    if (sectionType === 'listening') {
      table = LISTENING_BAND_TABLE;
    } else if (sectionType === 'reading') {
      table = testType === 'general_training'
        ? READING_GENERAL_BAND_TABLE
        : READING_ACADEMIC_BAND_TABLE;
    } else {
      // Writing and speaking are not auto-scored with simple tables in IELTS
      return 0;
    }
  }

  if (!table) return 0;

  const match = table.find(r => rawScore >= r.min && rawScore <= r.max);
  return match ? match.band : 0;
}

/**
 * Calculate overall band score from section bands.
 * Handles IELTS (average + rounding) and TOEFL iTP (sum * 10 / 3).
 */
export function calculateOverallBand(
  listening: number | null,
  reading: number | null,
  writing: number | null,
  speaking: number | null,
  structure: number | null = null, // New arg for structure
  testType: string = 'academic'
): number {
  if (testType === 'toefl_itp') {
    // Formula: (Listening + Structure + Reading) * 10 / 3
    const l = listening ?? 31;
    const s = structure ?? 31;
    const r = reading ?? 31;
    const total = (l + s + r) * 10 / 3;
    return Math.round(total); // Usually rounded to nearest whole number
  }

  // IELTS Logic - only count sections with actual scores (> 0)
  // Sections that weren't taken will have null or 0, exclude them
  const sections: number[] = [];
  const hasValidScore = (v: number | null): v is number =>
    v !== null && v !== undefined && typeof v === 'number' && !isNaN(v) && v > 0;

  if (hasValidScore(listening)) sections.push(listening);
  if (hasValidScore(reading)) sections.push(reading);
  if (hasValidScore(writing)) sections.push(writing);
  if (hasValidScore(speaking)) sections.push(speaking);

  // If no valid sections scored, return 0
  if (sections.length === 0) return 0;

  const sum = sections.reduce((a, b) => a + b, 0);
  const avg = sum / sections.length;

  // IELTS Rounding: nearest 0.5
  // .0 -> .0, .125 -> .0, .25 -> .5, .75 -> 1.0
  const remainder = avg % 1;
  let finalBand = Math.floor(avg);

  if (remainder < 0.25) {
    // keep integer
  } else if (remainder < 0.75) {
    finalBand += 0.5;
  } else {
    finalBand += 1.0;
  }

  return finalBand;
}

export async function scoreObjectiveSection(attemptId: string, sectionType: SectionType, testType: string): Promise<number> {
  // 1. Fetch questions for this section
  // 2. Fetch user responses for this attempt & section
  // 3. Compare and sum points
  // 4. Update attempt with raw score & band

  // This is a "service method" so we might need to query DB.
  // Ideally this logic should be in a service class, but functionally:

  const questionsResult = await query(
    `SELECT q.*
     FROM questions q
     JOIN sections s ON s.id = q.section_id
     JOIN attempts a ON a.test_id = s.test_id
     WHERE a.id = $1 AND s.section_type = $2
     ORDER BY q.question_number ASC`,
    [attemptId, sectionType]
  );
  const questions = questionsResult.rows;

  // No questions for this section type - return without updating band (leave it null)
  if (questions.length === 0) {
    return 0;
  }

  const responsesResult = await query(
    `SELECT * FROM responses WHERE attempt_id = $1 AND section_id IN (
       SELECT id FROM sections WHERE section_type = $2
    )`,
    [attemptId, sectionType]
  );
  const responses = responsesResult.rows;

  let rawScore = 0;

  for (const q of questions) {
    const response = responses.find(r => r.question_id === q.id);
    if (response) {
      // Parse answerData if stringified
      let ans = response.answer_data;
      if (typeof ans === 'string') {
        try { ans = JSON.parse(ans); } catch { }
      } else if (ans && typeof ans === 'object' && ans.answerData) {
        // handle case where DB driver returns structured object or our own model
      }

      const { points, isCorrect } = checkAnswer(q, ans);
      if (isCorrect) {
        rawScore += points;
      }

      // Optional: Update response with is_correct field for feedback
      await query(
        `UPDATE responses SET is_correct = $1, score = $2 WHERE id = $3`,
        [isCorrect, points, response.id]
      );
    }
  }

  const band = convertToBand(rawScore, sectionType, testType);

  // Update attempt
  let column = '';
  let bandColumn = '';

  if (testType === 'toefl_itp') {
    // TOEFL iTP uses _score columns (31-68 scale)
    if (sectionType === 'listening') {
      column = 'listening_raw';
      bandColumn = 'listening_score';
    } else if (sectionType === 'reading') {
      column = 'reading_raw';
      bandColumn = 'reading_score';
    } else if (sectionType === 'structure') {
      column = 'structure_raw';
      bandColumn = 'structure_score';
    }
  } else {
    // IELTS / Default uses _band columns (0-9 scale)
    if (sectionType === 'listening') {
      column = 'listening_raw';
      bandColumn = 'listening_band';
    } else if (sectionType === 'reading') {
      column = 'reading_raw';
      bandColumn = 'reading_band';
    }
  }
  // Determine the numeric values to save
  // For TOEFL, 'band' variable actually holds the scaled score (31-68).
  // For IELTS, it holds the band (0-9).

  if (column && bandColumn) {
    const updateQuery = `
      UPDATE attempts
      SET ${column} = $1, ${bandColumn} = $2
      WHERE id = $3
    `;
    try {
      await query(updateQuery, [rawScore, band, attemptId]);
    } catch (e) {
      console.error(`Failed to update score columns (${column}, ${bandColumn})`, e);
    }
  }

  return band;
}

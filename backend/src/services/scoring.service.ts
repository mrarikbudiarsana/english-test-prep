import * as questionModel from '../models/question.model';
import * as responseModel from '../models/response.model';
import * as attemptModel from '../models/attempt.model';
import * as sectionModel from '../models/section.model';
import { NotFoundError } from '../middleware/errorHandler';
import { SectionType } from '../types/test.types';

// ---------------------------------------------------------------------------
// IELTS Band Score Conversion Tables
// Based on official IELTS scoring: 40 questions per section
// ---------------------------------------------------------------------------

/**
 * IELTS Listening band score conversion table.
 * Maps raw score (number of correct answers out of 40) to band score.
 */
const LISTENING_BAND_TABLE: Array<{ min: number; max: number; band: number }> = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 27, max: 29, band: 6.5 },
  { min: 23, max: 26, band: 6.0 },
  { min: 20, max: 22, band: 5.5 },
  { min: 16, max: 19, band: 5.0 },
  { min: 13, max: 15, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 8, max: 9, band: 3.5 },
  { min: 6, max: 7, band: 3.0 },
  { min: 4, max: 5, band: 2.5 },
  { min: 2, max: 3, band: 2.0 },
  { min: 1, max: 1, band: 1.0 },
  { min: 0, max: 0, band: 0.0 },
];

/**
 * IELTS Academic Reading band score conversion table.
 * Maps raw score (number of correct answers out of 40) to band score.
 */
const READING_ACADEMIC_BAND_TABLE: Array<{ min: number; max: number; band: number }> = [
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
  { min: 2, max: 3, band: 2.0 },
  { min: 1, max: 1, band: 1.0 },
  { min: 0, max: 0, band: 0.0 },
];

/**
 * IELTS General Training Reading band score conversion table.
 * Maps raw score (number of correct answers out of 40) to band score.
 */
const READING_GENERAL_BAND_TABLE: Array<{ min: number; max: number; band: number }> = [
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
  { min: 3, max: 5, band: 2.0 },
  { min: 1, max: 2, band: 1.0 },
  { min: 0, max: 0, band: 0.0 },
];

// ---------------------------------------------------------------------------
// Answer comparison helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a string answer for comparison: trim whitespace and lowercase.
 */
function normalize(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
}

/**
 * Compare answers for multiple_choice question type.
 * Supports both single answer (string) and multiple answer (array) formats.
 */
function compareMultipleChoice(userAnswer: any, correctAnswer: any): boolean {
  // If both are arrays, compare sorted arrays
  if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
    if (userAnswer.length !== correctAnswer.length) return false;
    const sortedUser = userAnswer.map(normalize).sort();
    const sortedCorrect = correctAnswer.map(normalize).sort();
    return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
  }

  // Single value comparison
  return normalize(userAnswer) === normalize(correctAnswer);
}

/**
 * Compare answers for true_false_not_given or yes_no_not_given question types.
 */
function compareTrueFalse(userAnswer: any, correctAnswer: any): boolean {
  return normalize(userAnswer) === normalize(correctAnswer);
}

/**
 * Compare answers for completion question types.
 * The correctAnswer may contain an `alternatives` array for acceptable variations.
 * correctAnswer format: { answer: "main answer", alternatives: ["alt1", "alt2"] }
 * or simply a string.
 */
function compareCompletion(userAnswer: any, correctAnswer: any): boolean {
  const userNorm = normalize(userAnswer);

  if (typeof correctAnswer === 'string') {
    return userNorm === normalize(correctAnswer);
  }

  // correctAnswer is an object with answer + alternatives
  if (correctAnswer && typeof correctAnswer === 'object') {
    const mainAnswer = normalize(correctAnswer.answer);
    if (userNorm === mainAnswer) return true;

    if (Array.isArray(correctAnswer.alternatives)) {
      return correctAnswer.alternatives.some(
        (alt: string) => normalize(alt) === userNorm,
      );
    }
  }

  return false;
}

/**
 * Compare answers for matching question types.
 * Both userAnswer and correctAnswer are objects mapping items to their matches.
 * e.g. { "1": "C", "2": "A", "3": "B" }
 */
function compareMatching(userAnswer: any, correctAnswer: any): { correct: number; total: number } {
  if (!userAnswer || typeof userAnswer !== 'object') {
    return { correct: 0, total: Object.keys(correctAnswer || {}).length };
  }

  const correctKeys = Object.keys(correctAnswer);
  let correctCount = 0;

  for (const key of correctKeys) {
    if (normalize(userAnswer[key]) === normalize(correctAnswer[key])) {
      correctCount++;
    }
  }

  return { correct: correctCount, total: correctKeys.length };
}

/**
 * Compare answers for dropdown question types.
 * Both userAnswer and correctAnswer are objects mapping placeholder IDs to values.
 * e.g. { "gap1": "answer1", "gap2": "answer2" }
 */
function compareDropdown(userAnswer: any, correctAnswer: any): { correct: number; total: number } {
  if (!userAnswer || typeof userAnswer !== 'object') {
    return { correct: 0, total: Object.keys(correctAnswer || {}).length };
  }

  const correctKeys = Object.keys(correctAnswer);
  let correctCount = 0;

  for (const key of correctKeys) {
    if (normalize(userAnswer[key]) === normalize(correctAnswer[key])) {
      correctCount++;
    }
  }

  return { correct: correctCount, total: correctKeys.length };
}

// ---------------------------------------------------------------------------
// Main scoring functions
// ---------------------------------------------------------------------------

/**
 * Auto-score an objective section (listening or reading).
 * Fetches all questions with correct answers and all user responses,
 * compares each using type-specific logic, and returns the raw score.
 */
export async function scoreObjectiveSection(
  attemptId: string,
  sectionType: SectionType,
): Promise<{ rawScore: number; totalQuestions: number }> {
  // Get the attempt to find the test
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  // Get all sections of the given type for this test
  const sections = await sectionModel.findByTestIdAndType(attempt.testId, sectionType);
  if (sections.length === 0) {
    return { rawScore: 0, totalQuestions: 0 };
  }

  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const section of sections) {
    // Fetch all questions with correct answers for this section
    const questions = await questionModel.findBySectionId(section.id);
    // Fetch all user responses for this section and attempt
    const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);

    // Build a map of questionId -> user response
    const responseMap = new Map<string, any>();
    for (const resp of responses) {
      responseMap.set(resp.questionId, resp);
    }

    for (const question of questions) {
      totalQuestions++;

      const userResponse = responseMap.get(question.id);
      if (!userResponse) {
        // No response submitted for this question
        await responseModel.upsert({
          attemptId,
          questionId: question.id,
          sectionId: section.id,
          answerData: null,
        }).catch(() => {
          // Response may not exist; skip scoring for unanswered
        });
        continue;
      }

      const userAnswer = userResponse.answerData;
      const correctAnswer = question.correctAnswer;
      let isCorrect = false;
      let questionScore = 0;

      switch (question.questionType) {
        case 'multiple_choice': {
          isCorrect = compareMultipleChoice(userAnswer, correctAnswer);
          questionScore = isCorrect ? question.points : 0;
          break;
        }

        case 'true_false_not_given':
        case 'yes_no_not_given': {
          isCorrect = compareTrueFalse(userAnswer, correctAnswer);
          questionScore = isCorrect ? question.points : 0;
          break;
        }

        case 'completion': {
          isCorrect = compareCompletion(userAnswer, correctAnswer);
          questionScore = isCorrect ? question.points : 0;
          break;
        }

        case 'matching': {
          const result = compareMatching(userAnswer, correctAnswer);
          // For matching, each correct pair counts as a correct answer
          totalCorrect += result.correct;
          // Adjust totalQuestions: replace the single question with the number of pairs
          totalQuestions += result.total - 1; // -1 because we already counted +1 above
          // Update response score
          await responseModel.updateScore(userResponse.id, {
            isCorrect: result.correct === result.total,
            score: result.correct,
          });
          continue; // Skip the common updateScore below
        }

        case 'dropdown': {
          const result = compareDropdown(userAnswer, correctAnswer);
          totalCorrect += result.correct;
          totalQuestions += result.total - 1;
          await responseModel.updateScore(userResponse.id, {
            isCorrect: result.correct === result.total,
            score: result.correct,
          });
          continue;
        }

        default: {
          // Unknown question type, skip
          continue;
        }
      }

      if (isCorrect) {
        totalCorrect += questionScore;
      }

      // Update the individual response score
      await responseModel.updateScore(userResponse.id, {
        isCorrect,
        score: questionScore,
      });
    }
  }

  // Update the attempt with raw score and band
  const band = convertToBand(totalCorrect, sectionType);

  if (sectionType === 'listening') {
    await attemptModel.updateScores(attemptId, {
      listeningRaw: totalCorrect,
      listeningBand: band,
    });
  } else if (sectionType === 'reading') {
    await attemptModel.updateScores(attemptId, {
      readingRaw: totalCorrect,
      readingBand: band,
    });
  }

  return { rawScore: totalCorrect, totalQuestions };
}

/**
 * Convert a raw score to an IELTS band score using the appropriate conversion table.
 */
export function convertToBand(
  rawScore: number,
  sectionType: SectionType,
  testType: string = 'academic',
): number {
  let table: Array<{ min: number; max: number; band: number }>;

  if (sectionType === 'listening') {
    table = LISTENING_BAND_TABLE;
  } else if (sectionType === 'reading') {
    table = testType === 'general_training'
      ? READING_GENERAL_BAND_TABLE
      : READING_ACADEMIC_BAND_TABLE;
  } else {
    // Writing and speaking are not auto-scored with band tables
    return 0;
  }

  for (const entry of table) {
    if (rawScore >= entry.min && rawScore <= entry.max) {
      return entry.band;
    }
  }

  // If raw score exceeds the table (shouldn't happen), return max band
  if (rawScore > 40) return 9.0;

  return 0;
}

/**
 * Calculate the overall IELTS band score from individual section bands.
 * The overall band is the average of all four sections, rounded to the nearest 0.5.
 */
export function calculateOverallBand(
  listening: number,
  reading: number,
  writing: number,
  speaking: number,
): number {
  const average = (listening + reading + writing + speaking) / 4;

  // Round to nearest 0.5
  // e.g. 6.1 -> 6.0, 6.25 -> 6.5, 6.75 -> 7.0, 6.625 -> 6.5
  return Math.round(average * 2) / 2;
}

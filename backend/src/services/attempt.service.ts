import * as attemptModel from '../models/attempt.model';
import * as testModel from '../models/test.model';
import * as userModel from '../models/user.model';
import * as subscriptionModel from '../models/subscription.model';
import { query } from '../config/database';
import * as scoringService from './scoring.service';
import * as aiScoringService from './ai-scoring.service';
import * as toeflIbtScoringService from './toefl-ibt-scoring.service';
import { logToeflIbtAuditEvent } from './toefl-ibt-audit.service';
import {
  TOEFL_IBT_MAPPING_VERSION,
  bandToScore30,
  computeOverallBand as computeToeflOverallBand,
  overallBandToCefr,
  rawToScore30,
  readingRawToScaled,
  listeningRawToScaled,
  writingRawToScaled,
  speakingRawToScaled,
} from '../config/toeflIbtScoreMappings';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler';
import { AttemptMode, SectionType } from '../types/test.types';

const WRITING_TIMEOUT_MS = Number(process.env.AI_WRITING_TIMEOUT_MS || 120000);
const SPEAKING_TIMEOUT_MS = Number(process.env.AI_SPEAKING_TIMEOUT_MS || 180000);
const FINALIZE_TIMEOUT_MS = Number(process.env.AI_FINALIZE_TIMEOUT_MS || 45000);
const RESULTS_RESCUE_TIMEOUT_MS = Number(process.env.AI_RESULTS_RESCUE_TIMEOUT_MS || 200000);
const SCORING_RETRY_INTERVAL_MS = Number(process.env.AI_SCORING_RETRY_INTERVAL_MS || 10000);
const MAX_RESCUE_ATTEMPTS = Number(process.env.AI_MAX_RESCUE_ATTEMPTS || 5);

const scoringInFlight = new Set<string>();
const lastScoringAttemptAt = new Map<string, number>();
const rescueAttemptCount = new Map<string, number>();

const EXAM_TYPE_TO_TEST_TYPES: Record<string, string[]> = {
  ielts: ['academic', 'general_training'],
  toefl_ibt: ['toefl_ibt'],
  toefl_itp: ['toefl_itp'],
  pte: ['pte_academic'],
};

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const observed = operation.then(
    (value) => ({ type: 'result' as const, value }),
    (error) => ({ type: 'error' as const, error }),
  );

  const timeout = new Promise<{ type: 'timeout' }>((resolve) => {
    timeoutId = setTimeout(() => resolve({ type: 'timeout' }), timeoutMs);
  });

  const winner = await Promise.race([observed, timeout]);
  if (timeoutId) clearTimeout(timeoutId);

  if (winner.type === 'timeout') {
    throw new Error(`${label} timed out after ${timeoutMs}ms`);
  }

  if (winner.type === 'error') {
    throw winner.error;
  }

  return winner.value;
}

/** Map a DB test_type to its exam type for subscription checks. */
function testTypeToExamType(testType: string): string {
  if (testType === 'academic' || testType === 'general_training') return 'ielts';
  if (testType === 'toefl_ibt') return 'toefl_ibt';
  if (testType === 'toefl_itp') return 'toefl_itp';
  if (testType === 'pte_academic') return 'pte';
  return 'ielts';
}

function parseNullableNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function addYears(dateValue: Date | string, years: number): string {
  const dt = new Date(dateValue);
  dt.setUTCFullYear(dt.getUTCFullYear() + years);
  return dt.toISOString().slice(0, 10);
}

function clampPteScore(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.max(10, Math.min(90, Math.round(value)));
}

type PteWeightBucket = {
  overall: number;
  listening: number;
  reading: number;
  speaking: number;
  writing: number;
};

const PTE_QUESTION_WEIGHTS: Record<string, PteWeightBucket> = {
  'Read Aloud': { overall: 4, listening: 0, reading: 0, speaking: 9, writing: 0 },
  'Repeat Sentence': { overall: 7, listening: 17, reading: 0, speaking: 16, writing: 0 },
  'Describe Image': { overall: 15, listening: 0, reading: 0, speaking: 31, writing: 0 },
  'Retell Lecture': { overall: 6, listening: 13, reading: 0, speaking: 13, writing: 0 },
  'Answer Short Question': { overall: 2, listening: 4, reading: 0, speaking: 0, writing: 0 },
  'Summarize Group Discussion': { overall: 9, listening: 20, reading: 0, speaking: 19, writing: 0 },
  'Respond to a Situation': { overall: 6, listening: 0, reading: 0, speaking: 13, writing: 0 },
  'Summarize Written Text': { overall: 7, listening: 0, reading: 23, speaking: 0, writing: 28 },
  'Write Essay': { overall: 7, listening: 0, reading: 0, speaking: 0, writing: 31 },
  'Fill in the Blanks (Dropdown)': { overall: 7, listening: 0, reading: 25, speaking: 0, writing: 0 },
  'Multiple Choice, Multiple Answers (Reading)': { overall: 1, listening: 0, reading: 5, speaking: 0, writing: 0 },
  'Reorder Paragraph': { overall: 3, listening: 0, reading: 9, speaking: 0, writing: 0 },
  'Fill in the Blanks (Drag and Drop)': { overall: 6, listening: 0, reading: 20, speaking: 0, writing: 0 },
  'Multiple Choice, Single Answer (Reading)': { overall: 0.5, listening: 0, reading: 3, speaking: 0, writing: 0 },
  'Summarize Spoken Text': { overall: 4, listening: 10, reading: 0, speaking: 0, writing: 18 },
  'Multiple Choice, Multiple Answers (Listening)': { overall: 1, listening: 3, reading: 0, speaking: 0, writing: 0 },
  'Fill in the Blanks (Type In)': { overall: 3, listening: 8, reading: 0, speaking: 0, writing: 0 },
  'Highlight Correct Summary': { overall: 0.5, listening: 2, reading: 3, speaking: 0, writing: 0 },
  'Multiple Choice, Single Answer (Listening)': { overall: 0.5, listening: 2, reading: 0, speaking: 0, writing: 0 },
  'Select Missing Word': { overall: 1, listening: 1, reading: 0, speaking: 0, writing: 0 },
  'Highlight Incorrect Words': { overall: 4, listening: 8, reading: 13, speaking: 0, writing: 0 },
  'Write from Dictation': { overall: 5, listening: 13, reading: 0, speaking: 0, writing: 23 },
};

const PTE_SKILLS_PROFILE_MAP: Record<string, string[]> = {
  openResponseSpeakingWriting: [
    'Describe Image',
    'Retell Lecture',
    'Summarize Group Discussion',
    'Respond to a Situation',
    'Summarize Written Text',
    'Write Essay',
    'Summarize Spoken Text',
  ],
  reproducingSpokenWrittenLanguage: [
    'Read Aloud',
    'Repeat Sentence',
    'Write from Dictation',
  ],
  extendedWriting: [
    'Summarize Written Text',
    'Write Essay',
    'Summarize Spoken Text',
  ],
  shortWriting: [
    'Write from Dictation',
  ],
  extendedSpeaking: [
    'Describe Image',
    'Retell Lecture',
    'Summarize Group Discussion',
    'Respond to a Situation',
  ],
  shortSpeaking: [
    'Read Aloud',
    'Repeat Sentence',
  ],
  multipleSkillsComprehension: [
    'Repeat Sentence',
    'Retell Lecture',
    'Summarize Group Discussion',
    'Summarize Written Text',
    'Summarize Spoken Text',
    'Highlight Correct Summary',
    'Highlight Incorrect Words',
    'Write from Dictation',
  ],
  singleSkillComprehension: [
    'Answer Short Question',
    'Respond to a Situation',
    'Fill in the Blanks (Dropdown)',
    'Multiple Choice, Multiple Answers (Reading)',
    'Reorder Paragraph',
    'Fill in the Blanks (Drag and Drop)',
    'Multiple Choice, Single Answer (Reading)',
    'Multiple Choice, Multiple Answers (Listening)',
    'Fill in the Blanks (Type In)',
    'Multiple Choice, Single Answer (Listening)',
    'Select Missing Word',
  ],
};

function parseMaybeJson(value: any): any {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('[') || (trimmed.startsWith('"') && trimmed.endsWith('"')))) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizePteTaskType(raw: string): string | null {
  const text = raw.toLowerCase();
  if (text.includes('read aloud')) return 'Read Aloud';
  if (text.includes('repeat sentence')) return 'Repeat Sentence';
  if (text.includes('describe image')) return 'Describe Image';
  if (text.includes('retell lecture')) return 'Retell Lecture';
  if (text.includes('answer short question')) return 'Answer Short Question';
  if (text.includes('summarize group discussion')) return 'Summarize Group Discussion';
  if (text.includes('respond to a situation')) return 'Respond to a Situation';
  if (text.includes('summarize written text') || text.includes('summarise written text')) return 'Summarize Written Text';
  if (text.includes('write essay')) return 'Write Essay';
  if (text.includes('summarize spoken text') || text.includes('summarise spoken text')) return 'Summarize Spoken Text';
  return null;
}

function inferPteQuestionType(row: any): string | null {
  const qType = String(row.question_type || '');
  const sectionType = String(row.section_type || '');

  if (qType === 'pte_reading_fill_blanks_dropdown') return 'Fill in the Blanks (Dropdown)';
  if (qType === 'pte_reading_fill_blanks_drag_drop') return 'Fill in the Blanks (Drag and Drop)';
  if (qType === 'pte_reorder_paragraph') return 'Reorder Paragraph';
  if (qType === 'pte_listening_fill_blanks') return 'Fill in the Blanks (Type In)';
  if (qType === 'pte_highlight_correct_summary') return 'Highlight Correct Summary';
  if (qType === 'pte_select_missing_word') return 'Select Missing Word';
  if (qType === 'pte_highlight_incorrect_words') return 'Highlight Incorrect Words';
  if (qType === 'pte_write_from_dictation') return 'Write from Dictation';
  if (qType === 'pte_mcq_multiple') {
    return sectionType === 'reading'
      ? 'Multiple Choice, Multiple Answers (Reading)'
      : 'Multiple Choice, Multiple Answers (Listening)';
  }
  if (qType === 'pte_mcq_single') {
    return sectionType === 'reading'
      ? 'Multiple Choice, Single Answer (Reading)'
      : 'Multiple Choice, Single Answer (Listening)';
  }

  if (qType === 'speaking_response' || qType === 'writing_task') {
    const hint = `${row.task_type || ''} ${row.section_title || ''} ${row.section_instructions || ''} ${row.task_description || ''}`;
    return normalizePteTaskType(hint);
  }

  return null;
}

function getObjectiveMaxPoints(row: any): number {
  const qType = String(row.question_type || '');
  const base = Number(row.question_points);
  const basePoints = Number.isFinite(base) && base > 0 ? base : 1;
  const correct = parseMaybeJson(row.correct_answer);

  if (qType === 'pte_mcq_multiple' || qType === 'pte_highlight_incorrect_words') {
    const derived = Array.isArray(correct) ? correct.length : 1;
    return Math.max(basePoints, derived);
  }

  if (
    qType === 'pte_reading_fill_blanks_dropdown' ||
    qType === 'pte_reading_fill_blanks_drag_drop' ||
    qType === 'pte_listening_fill_blanks'
  ) {
    const derived = correct && typeof correct === 'object' && !Array.isArray(correct) ? Object.keys(correct).length : 1;
    return Math.max(basePoints, derived);
  }

  if (qType === 'pte_reorder_paragraph') {
    const arr = Array.isArray(correct) ? correct : [];
    const derived = Math.max(1, arr.length - 1);
    return Math.max(basePoints, derived);
  }

  if (qType === 'pte_write_from_dictation') {
    const sentence = String(correct || '');
    const derived = Math.max(1, sentence.trim().split(/\s+/).filter(Boolean).length);
    return Math.max(basePoints, derived);
  }

  return basePoints;
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function weightedMeanByBuckets(
  typeScores: Record<string, number>,
  questionTypes: string[],
  buckets: Array<keyof PteWeightBucket>,
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const type of questionTypes) {
    const score = typeScores[type];
    if (typeof score !== 'number' || Number.isNaN(score)) continue;
    const matrix = PTE_QUESTION_WEIGHTS[type];
    let weight = 0;
    if (matrix) {
      weight = buckets.reduce((sum, bucket) => sum + (matrix[bucket] || 0), 0);
    }
    if (weight <= 0) {
      weight = matrix?.overall ?? 1;
    }
    weightedSum += score * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) return null;
  return clampPteScore(weightedSum / totalWeight);
}

function toFixedNumber(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function buildWeightedDetails(
  typeScores: Record<string, number>,
  questionTypes: string[],
  buckets: Array<keyof PteWeightBucket>,
) {
  const details: Array<{ questionType: string; score: number; weight: number; weighted: number }> = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const type of questionTypes) {
    const score = typeScores[type];
    if (typeof score !== 'number' || Number.isNaN(score)) continue;
    const matrix = PTE_QUESTION_WEIGHTS[type];
    let weight = 0;
    if (matrix) {
      weight = buckets.reduce((sum, bucket) => sum + (matrix[bucket] || 0), 0);
    }
    if (weight <= 0) {
      weight = matrix?.overall ?? 1;
    }
    const weighted = score * weight;
    weightedSum += weighted;
    totalWeight += weight;
    details.push({ questionType: type, score, weight, weighted: toFixedNumber(weighted) });
  }

  const score = totalWeight > 0 ? clampPteScore(weightedSum / totalWeight) : null;
  return {
    score,
    totalWeight: toFixedNumber(totalWeight),
    weightedSum: toFixedNumber(weightedSum),
    details,
  };
}

async function buildPteAnalyticsWithDebug(attemptId: string, attempt: any) {
  const listening = clampPteScore(attempt.listeningBand);
  const reading = clampPteScore(attempt.readingBand);
  const writing = clampPteScore(attempt.writingBand);
  const speaking = clampPteScore(attempt.speakingBand);
  const overall = clampPteScore(attempt.overallBand);

  const responseRows = await query(
    `SELECT
      r.score AS response_score,
      q.question_type,
      q.points AS question_points,
      q.correct_answer,
      s.section_type,
      s.task_type,
      s.title AS section_title,
      s.instructions AS section_instructions,
      s.task_description
     FROM responses r
     JOIN questions q ON q.id = r.question_id
     JOIN sections s ON s.id = r.section_id
     WHERE r.attempt_id = $1
       AND r.score IS NOT NULL`,
    [attemptId],
  );

  const byTypeNormalized: Record<string, number[]> = {};

  for (const row of responseRows.rows) {
    const canonicalType = inferPteQuestionType(row);
    if (!canonicalType) continue;

    const responseScore = Number(row.response_score);
    if (!Number.isFinite(responseScore)) continue;

    let normalized = 0;
    if (row.question_type === 'writing_task' || row.question_type === 'speaking_response') {
      normalized = Math.max(0, Math.min(1, (responseScore - 10) / 80));
    } else {
      const maxPoints = getObjectiveMaxPoints(row);
      normalized = maxPoints > 0
        ? Math.max(0, Math.min(1, responseScore / maxPoints))
        : 0;
    }

    if (!byTypeNormalized[canonicalType]) byTypeNormalized[canonicalType] = [];
    byTypeNormalized[canonicalType].push(normalized);
  }

  const typeScores: Record<string, number> = {};
  for (const [type, values] of Object.entries(byTypeNormalized)) {
    const avg = mean(values);
    if (avg === null) continue;
    typeScores[type] = Math.max(10, Math.min(90, Math.round(10 + avg * 80)));
  }

  const allObservedTypes = Object.keys(typeScores);
  const overallWeighted = buildWeightedDetails(typeScores, allObservedTypes, ['overall']);
  const listeningWeighted = buildWeightedDetails(typeScores, allObservedTypes, ['listening']);
  const readingWeighted = buildWeightedDetails(typeScores, allObservedTypes, ['reading']);
  const speakingWeighted = buildWeightedDetails(typeScores, allObservedTypes, ['speaking']);
  const writingWeighted = buildWeightedDetails(typeScores, allObservedTypes, ['writing']);

  const profileWeighted = {
    openResponseSpeakingWriting: buildWeightedDetails(
      typeScores,
      PTE_SKILLS_PROFILE_MAP.openResponseSpeakingWriting,
      ['speaking', 'writing'],
    ),
    reproducingSpokenWrittenLanguage: buildWeightedDetails(
      typeScores,
      PTE_SKILLS_PROFILE_MAP.reproducingSpokenWrittenLanguage,
      ['listening', 'speaking', 'writing'],
    ),
    extendedWriting: buildWeightedDetails(typeScores, PTE_SKILLS_PROFILE_MAP.extendedWriting, ['writing']),
    shortWriting: buildWeightedDetails(typeScores, PTE_SKILLS_PROFILE_MAP.shortWriting, ['writing']),
    extendedSpeaking: buildWeightedDetails(typeScores, PTE_SKILLS_PROFILE_MAP.extendedSpeaking, ['speaking']),
    shortSpeaking: buildWeightedDetails(typeScores, PTE_SKILLS_PROFILE_MAP.shortSpeaking, ['speaking']),
    multipleSkillsComprehension: buildWeightedDetails(
      typeScores,
      PTE_SKILLS_PROFILE_MAP.multipleSkillsComprehension,
      ['listening', 'reading', 'writing', 'speaking'],
    ),
    singleSkillComprehension: buildWeightedDetails(
      typeScores,
      PTE_SKILLS_PROFILE_MAP.singleSkillComprehension,
      ['listening', 'reading'],
    ),
  };

  const communicativeSkills = {
    overall: overallWeighted.score ?? overall,
    listening: listeningWeighted.score ?? listening,
    reading: readingWeighted.score ?? reading,
    speaking: speakingWeighted.score ?? speaking,
    writing: writingWeighted.score ?? writing,
  };

  const skillsProfile = {
    openResponseSpeakingWriting: profileWeighted.openResponseSpeakingWriting.score,
    reproducingSpokenWrittenLanguage: profileWeighted.reproducingSpokenWrittenLanguage.score,
    extendedWriting: profileWeighted.extendedWriting.score,
    shortWriting: profileWeighted.shortWriting.score,
    extendedSpeaking: profileWeighted.extendedSpeaking.score,
    shortSpeaking: profileWeighted.shortSpeaking.score,
    multipleSkillsComprehension: profileWeighted.multipleSkillsComprehension.score,
    singleSkillComprehension: profileWeighted.singleSkillComprehension.score,
  };

  const perQuestionType = Object.keys(typeScores)
    .sort((a, b) => a.localeCompare(b))
    .map((type) => ({
      questionType: type,
      normalizedAverage: toFixedNumber(mean(byTypeNormalized[type]) ?? 0, 4),
      scaledScore: typeScores[type],
      sampleCount: byTypeNormalized[type]?.length || 0,
      weights: PTE_QUESTION_WEIGHTS[type] || null,
    }));

  return {
    analytics: {
      communicativeSkills,
      skillsProfile,
    },
    debug: {
      typeScores,
      perQuestionType,
      communicativeWeighted: {
        overall: overallWeighted,
        listening: listeningWeighted,
        reading: readingWeighted,
        speaking: speakingWeighted,
        writing: writingWeighted,
      },
      profileWeighted,
    },
  };
}

async function buildPteAnalytics(attemptId: string, attempt: any) {
  const { analytics } = await buildPteAnalyticsWithDebug(attemptId, attempt);
  return analytics;
}

async function hydrateToeflIbt2026Reporting(attemptId: string) {
  const latest = await attemptModel.findById(attemptId);
  if (!latest) throw new NotFoundError('Attempt not found');
  if (latest.test?.testType !== 'toefl_ibt' || latest.test?.deliveryModel !== 'toefl_ibt_2026') {
    throw new ValidationError('TOEFL iBT 2026 reporting is only available for TOEFL iBT 2026 attempts');
  }

  const readingRaw = parseNullableNumber(latest.readingRaw);
  const listeningRaw = parseNullableNumber(latest.listeningRaw);
  const writingRaw = parseNullableNumber((latest as any).writingRaw);
  const speakingRaw = parseNullableNumber((latest as any).speakingRaw);

  const readingBand = parseNullableNumber(latest.readingBand);
  const listeningBand = parseNullableNumber(latest.listeningBand);
  const writingBand = parseNullableNumber(latest.writingBand);
  const speakingBand = parseNullableNumber(latest.speakingBand);

  const readingScore30 = parseNullableNumber((latest as any).readingScore30)
    ?? (readingRaw !== null ? readingRawToScaled(readingRaw) : (readingBand !== null ? bandToScore30(readingBand) : null));
  const listeningScore30 = parseNullableNumber((latest as any).listeningScore30)
    ?? (listeningRaw !== null ? listeningRawToScaled(listeningRaw) : (listeningBand !== null ? bandToScore30(listeningBand) : null));
  const writingScore30 = parseNullableNumber((latest as any).writingScore30)
    ?? (writingRaw !== null ? writingRawToScaled(writingRaw) : (writingBand !== null ? bandToScore30(writingBand) : null));
  const speakingScore30 = parseNullableNumber((latest as any).speakingScore30)
    ?? (speakingRaw !== null ? speakingRawToScaled(speakingRaw) : (speakingBand !== null ? bandToScore30(speakingBand) : null));

  const sectionBands = [readingBand, listeningBand, writingBand, speakingBand];
  const hasAllBands = sectionBands.every((b) => b !== null);
  const computedOverallBand = hasAllBands
    ? computeToeflOverallBand(sectionBands as number[])
    : parseNullableNumber(latest.overallBand);
  const overallScore120 = [readingScore30, listeningScore30, writingScore30, speakingScore30].every((s) => s !== null)
    ? (readingScore30 as number) + (listeningScore30 as number) + (writingScore30 as number) + (speakingScore30 as number)
    : null;
  const scoreReportable = hasAllBands && overallScore120 !== null;
  const scoreMappingVersion = (latest as any).scoreMappingVersion || TOEFL_IBT_MAPPING_VERSION;
  const cefrLevel = computedOverallBand !== null ? overallBandToCefr(computedOverallBand) : null;
  const validUntil = latest.completedAt ? addYears(latest.completedAt, 2) : null;

  await attemptModel.updateScores(attemptId, {
    readingScore30: readingScore30 ?? undefined,
    listeningScore30: listeningScore30 ?? undefined,
    writingScore30: writingScore30 ?? undefined,
    speakingScore30: speakingScore30 ?? undefined,
    overallScore120: overallScore120 ?? undefined,
    scoreMappingVersion,
    cefrLevel: cefrLevel ?? undefined,
    scoreReportable,
    validUntil: validUntil ?? undefined,
    overallBand: computedOverallBand ?? undefined,
  });

  logToeflIbtAuditEvent('toefl_ibt_scores_hydrated', {
    attemptId,
    scoreMappingVersion,
    overallBand: computedOverallBand,
    overallScore120,
    cefrLevel,
    scoreReportable,
    validUntil,
  });

  const refreshed = await attemptModel.findById(attemptId);
  if (!refreshed) throw new NotFoundError('Attempt not found');

  return {
    attempt: refreshed,
    scores: {
      reading: { raw: readingRaw, band: parseNullableNumber(refreshed.readingBand), score30: parseNullableNumber((refreshed as any).readingScore30) },
      listening: { raw: listeningRaw, band: parseNullableNumber(refreshed.listeningBand), score30: parseNullableNumber((refreshed as any).listeningScore30) },
      writing: { raw: writingRaw, band: parseNullableNumber(refreshed.writingBand), score30: parseNullableNumber((refreshed as any).writingScore30) },
      speaking: { raw: speakingRaw, band: parseNullableNumber(refreshed.speakingBand), score30: parseNullableNumber((refreshed as any).speakingScore30) },
      overallBand: parseNullableNumber(refreshed.overallBand),
      overallScore120: parseNullableNumber((refreshed as any).overallScore120),
      scoreMappingVersion: (refreshed as any).scoreMappingVersion || TOEFL_IBT_MAPPING_VERSION,
      cefrLevel: (refreshed as any).cefrLevel || null,
      scoreReportable: (refreshed as any).scoreReportable ?? false,
      validUntil: (refreshed as any).validUntil || null,
    },
  };
}

export type AccessCheckResult = {
  canAccess: boolean;
  reason: 'free_test' | 'has_subscription' | 'has_free_tests' | 'no_access' | 'test_not_found';
  freeTestsRemaining?: number;
  requiredExamType?: string;
};

/**
 * Check whether a user has access to take a test.
 * Access is granted if:
 *  - The test is free, OR
 *  - The user has an active subscription for the test's exam type, OR
 *  - The user has free tests remaining
 * Returns detailed info about access status for frontend display.
 */
export async function checkTestAccess(userId: string, testId: string): Promise<AccessCheckResult> {
  // Check if the test exists
  const test = await testModel.findById(testId);
  if (!test) {
    return { canAccess: false, reason: 'test_not_found' };
  }

  // Check if the test is free
  if (test.isFree) {
    return { canAccess: true, reason: 'free_test' };
  }

  const examType = testTypeToExamType(test.testType);

  // Check for an active subscription covering this exam type
  const activeSub = await subscriptionModel.findActiveByUserIdAndExam(userId, examType);
  if (activeSub) {
    return { canAccess: true, reason: 'has_subscription' };
  }

  // Check for remaining free tests
  const user = await userModel.findById(userId);
  if (user && user.freeTestsRemaining > 0) {
    return {
      canAccess: true,
      reason: 'has_free_tests',
      freeTestsRemaining: user.freeTestsRemaining,
    };
  }

  return {
    canAccess: false,
    reason: 'no_access',
    freeTestsRemaining: user?.freeTestsRemaining ?? 0,
    requiredExamType: examType,
  };
}

/**
 * Start a new test attempt.
 * Validates that the user has access (subscription or free tests).
 * Decrements free_tests_remaining if the test is not free and the user has no subscription.
 */
export async function startAttempt(
  userId: string,
  testId: string,
  mode: AttemptMode = 'full',
  practiceSectionType?: SectionType,
) {
  // Verify the test exists and is published
  const test = await testModel.findById(testId);
  if (!test) {
    throw new NotFoundError('Test not found');
  }
  if (!test.isPublished) {
    throw new NotFoundError('Test not found');
  }

  // Validate mode and practiceSectionType
  if (mode === 'section_practice' && !practiceSectionType) {
    throw new ValidationError('Practice section type is required for section practice mode');
  }

  // Check test access
  const accessResult = await checkTestAccess(userId, testId);
  if (!accessResult.canAccess) {
    throw new ForbiddenError(
      'You do not have access to this test. Please subscribe or use your free tests.',
    );
  }

  // If the test is not free and user has no active subscription for this exam, decrement free tests
  if (!test.isFree) {
    const examType = testTypeToExamType(test.testType);
    const activeSub = await subscriptionModel.findActiveByUserIdAndExam(userId, examType);
    if (!activeSub) {
      const updated = await userModel.decrementFreeTests(userId);
      if (!updated) {
        throw new ForbiddenError('No free tests remaining. Please subscribe to continue.');
      }
    }
  }

  // Create the attempt record
  const attempt = await attemptModel.create({
    userId,
    testId,
    mode,
    practiceSectionType: practiceSectionType || undefined,
  });

  return attempt;
}

/**
 * Get an attempt by ID, ensuring it belongs to the given user.
 */
export async function getAttempt(id: string, userId?: string) {
  let attempt = await attemptModel.findById(id);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }
  if (userId && attempt.userId !== userId) {
    throw new ForbiddenError('You do not have access to this attempt');
  }

  // In serverless deployments, fire-and-forget scoring may be interrupted.
  // Results polling calls this method repeatedly, so we opportunistically
  // resume scoring here and keep attempts from being stuck in "scoring".
  if (attempt.status === 'scoring') {
    const now = Date.now();
    const lastAttempt = lastScoringAttemptAt.get(id) ?? 0;
    const isCoolingDown = now - lastAttempt < SCORING_RETRY_INTERVAL_MS;
    const attempts = rescueAttemptCount.get(id) ?? 0;

    // Force completion after too many rescue attempts to prevent infinite hangs
    if (attempts >= MAX_RESCUE_ATTEMPTS) {
      console.error(`Max rescue attempts (${MAX_RESCUE_ATTEMPTS}) exceeded for attempt ${id}, forcing completion`);
      try {
        await attemptModel.complete(id);
        rescueAttemptCount.delete(id);
        const refreshed = await attemptModel.findById(id);
        if (refreshed) {
          attempt = refreshed;
        }
      } catch (err) {
        console.error('Error forcing completion after max rescue attempts:', err);
      }
    } else if (!isCoolingDown && !scoringInFlight.has(id)) {
      scoringInFlight.add(id);
      lastScoringAttemptAt.set(id, now);
      rescueAttemptCount.set(id, attempts + 1);
      try {
        await withTimeout(
          triggerAIScoring(id),
          RESULTS_RESCUE_TIMEOUT_MS,
          'Results rescue scoring',
        );
        // Success - clear the rescue counter
        rescueAttemptCount.delete(id);
      } catch (err) {
        console.error('Results rescue scoring did not finish in time:', err);
      } finally {
        scoringInFlight.delete(id);
      }

      const refreshed = await attemptModel.findById(id);
      if (refreshed) {
        attempt = refreshed;
      }
    }
  }

  if (attempt.test?.testType === 'pte_academic') {
    const pteAnalytics = await buildPteAnalytics(id, attempt);
    return {
      ...attempt,
      pteAnalytics,
    };
  }

  return attempt;
}

/**
 * Get public share info for an attempt (no auth required).
 * Only returns basic info for OG image generation.
 */
export async function getShareInfo(id: string) {
  const attempt = await attemptModel.findById(id);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  const testType = attempt.test?.testType || 'academic';
  const isToeflItp = testType === 'toefl_itp';

  // Determine which sections were taken (score > 0)
  const sections: { type: string; label: string; score: number }[] = [];
  if (isToeflItp) {
    if (attempt.listeningScore && attempt.listeningScore > 0) {
      sections.push({ type: 'listening', label: 'Listening Comprehension', score: attempt.listeningScore });
    }
    if (attempt.structureScore && attempt.structureScore > 0) {
      sections.push({ type: 'structure', label: 'Structure and Written Expression', score: attempt.structureScore });
    }
    if (attempt.readingScore && attempt.readingScore > 0) {
      sections.push({ type: 'reading', label: 'Reading Comprehension', score: attempt.readingScore });
    }
  } else {
    if (attempt.listeningBand && attempt.listeningBand > 0) {
      sections.push({ type: 'listening', label: 'Listening', score: attempt.listeningBand });
    }
    if (attempt.readingBand && attempt.readingBand > 0) {
      sections.push({ type: 'reading', label: 'Reading', score: attempt.readingBand });
    }
    if (attempt.writingBand && attempt.writingBand > 0) {
      sections.push({ type: 'writing', label: 'Writing', score: attempt.writingBand });
    }
    if (attempt.speakingBand && attempt.speakingBand > 0) {
      sections.push({ type: 'speaking', label: 'Speaking', score: attempt.speakingBand });
    }
  }

  const isPartialTest = sections.length === 1;
  const singleSection = isPartialTest ? sections[0] : null;

  // Only return public info needed for sharing
  return {
    testTitle: attempt.test?.title || 'English Practice Test',
    testType,
    overallBand: attempt.overallBand,
    overallScore: attempt.overallScore,
    completedAt: attempt.completedAt,
    isPartialTest,
    singleSection,
    sections,
  };
}

/**
 * Get all attempts for a user with pagination.
 */
export async function getUserAttempts(
  userId: string,
  offset: number = 0,
  limit: number = 20,
  examType?: string,
  testType?: string,
) {
  const mappedTestTypes = examType ? EXAM_TYPE_TO_TEST_TYPES[examType] : undefined;
  const testTypes = testType ? [testType] : mappedTestTypes;
  return attemptModel.findByUserId(userId, offset, limit, testTypes);
}

/**
 * Update the current section being taken in an attempt.
 * Marks the section as started with a timestamp.
 */
export async function updateCurrentSection(attemptId: string, sectionType: SectionType) {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  if (attempt.status !== 'in_progress') {
    throw new ValidationError('Cannot update section on a completed or abandoned attempt');
  }

  return attemptModel.updateSection(attemptId, sectionType);
}

/**
 * Submit a section of the test.
 * If the section is listening or reading, auto-score it immediately.
 */
export async function submitSection(attemptId: string, sectionType: SectionType) {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  if (attempt.status !== 'in_progress') {
    throw new ValidationError('Cannot submit section on a completed or abandoned attempt');
  }

  // Auto-score objective sections
  if (sectionType === 'listening' || sectionType === 'reading' || sectionType === 'structure') {
    const test = await testModel.findById(attempt.testId);
    if (!test) {
      throw new NotFoundError('Test not found');
    }
    const score = await scoringService.scoreObjectiveSection(attemptId, sectionType, test.testType);
    return {
      attemptId,
      sectionType,
      score,
    };
  }

  // For writing and speaking, just acknowledge the submission
  // Actual scoring will happen when the entire test is submitted
  return {
    attemptId,
    sectionType,
    message: `${sectionType} section submitted. It will be scored after test completion.`,
  };
}

/**
 * Submit the entire test.
 * Marks the attempt status as 'scoring' and triggers AI scoring asynchronously.
 */
export async function submitTest(attemptId: string) {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  if (attempt.status !== 'in_progress') {
    throw new ValidationError('This attempt has already been submitted');
  }

  // Mark as scoring
  await attemptModel.updateStatus(attemptId, 'scoring');

  // Get test info for testType
  const test = await testModel.findById(attempt.testId);
  if (!test) {
    throw new NotFoundError('Test not found');
  }

  const isToeflItp = test.testType === 'toefl_itp';
  const isToeflIbt2026 = test.testType === 'toefl_ibt' && test.deliveryModel === 'toefl_ibt_2026';

  // Auto-score objective sections if not already scored
  if (!isToeflIbt2026 && (isToeflItp ? attempt.listeningScore : attempt.listeningBand) === null) {
    try {
      await scoringService.scoreObjectiveSection(attemptId, 'listening', test.testType);
    } catch (err) {
      console.error('Error auto-scoring listening:', err);
    }
  }

  if (!isToeflIbt2026 && (isToeflItp ? attempt.readingScore : attempt.readingBand) === null) {
    try {
      await scoringService.scoreObjectiveSection(attemptId, 'reading', test.testType);
    } catch (err) {
      console.error('Error auto-scoring reading:', err);
    }
  }

  if (isToeflItp && attempt.structureScore === null) {
    try {
      await scoringService.scoreObjectiveSection(attemptId, 'structure', test.testType);
    } catch (err) {
      console.error('Error auto-scoring structure:', err);
    }
  }

  // Trigger AI scoring asynchronously (do not await)
  triggerAIScoring(attemptId).catch((err) => {
    console.error('Error in AI scoring pipeline:', err);
  });

  return attemptModel.findById(attemptId);
}

export async function getToeflIbtScores(attemptId: string, userId: string) {
  const attempt = await getAttempt(attemptId, userId);
  if (attempt.test?.testType !== 'toefl_ibt' || attempt.test?.deliveryModel !== 'toefl_ibt_2026') {
    throw new ValidationError('Scores endpoint is only available for TOEFL iBT 2026 attempts');
  }
  return hydrateToeflIbt2026Reporting(attemptId);
}

export async function getToeflIbtReport(attemptId: string, userId: string) {
  const { attempt, scores } = await getToeflIbtScores(attemptId, userId);
  logToeflIbtAuditEvent('toefl_ibt_report_generated', {
    attemptId,
    userId,
    scoreMappingVersion: scores.scoreMappingVersion,
    overallBand: scores.overallBand,
    overallScore120: scores.overallScore120,
    cefrLevel: scores.cefrLevel,
    scoreReportable: scores.scoreReportable,
  });
  return {
    attemptId: attempt.id,
    testId: attempt.testId,
    testTitle: attempt.test?.title || null,
    testType: attempt.test?.testType || null,
    deliveryModel: attempt.test?.deliveryModel || null,
    generatedAt: new Date().toISOString(),
    completedAt: attempt.completedAt,
    scoreMappingVersion: scores.scoreMappingVersion,
    scoreReportable: scores.scoreReportable,
    validUntil: scores.validUntil,
    cefrLevel: scores.cefrLevel,
    sections: {
      reading: scores.reading,
      listening: scores.listening,
      writing: scores.writing,
      speaking: scores.speaking,
    },
    overallBand: scores.overallBand,
    overallScore120: scores.overallScore120,
  };
}

export async function getPteAnalyticsDebug(attemptId: string, userId: string) {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }
  if (attempt.userId !== userId) {
    throw new ForbiddenError('You do not have access to this attempt');
  }
  if (attempt.test?.testType !== 'pte_academic') {
    throw new ValidationError('Debug analytics endpoint is only available for PTE Academic attempts');
  }

  const { analytics, debug } = await buildPteAnalyticsWithDebug(attemptId, attempt);

  return {
    attemptId: attempt.id,
    testId: attempt.testId,
    communicativeSkills: analytics.communicativeSkills,
    skillsProfile: analytics.skillsProfile,
    debug,
  };
}

/**
 * Delete an in-progress attempt owned by the user.
 */
export async function deleteAttempt(attemptId: string, userId: string) {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }
  if (attempt.userId !== userId) {
    throw new ForbiddenError('You do not have access to this attempt');
  }
  if (attempt.status !== 'in_progress') {
    throw new ValidationError('Only in-progress attempts can be deleted');
  }

  await attemptModel.remove(attemptId);
  return { success: true };
}

/**
 * Trigger the AI scoring pipeline for writing and speaking sections.
 * This runs asynchronously after the test is submitted.
 */
async function triggerAIScoring(attemptId: string): Promise<void> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) throw new NotFoundError('Attempt not found');
  const isToeflIbt2026 =
    attempt.test?.testType === 'toefl_ibt' && attempt.test?.deliveryModel === 'toefl_ibt_2026';

  if (isToeflIbt2026) {
    logToeflIbtAuditEvent('toefl_ibt_scoring_pipeline_start', {
      attemptId,
      testId: attempt.testId,
      deliveryModel: attempt.test?.deliveryModel || null,
    });
  }

  try {
    // Score writing section
    await withTimeout(
      isToeflIbt2026
        ? toeflIbtScoringService.scoreWriting(attemptId).then(() => { })
        : aiScoringService.scoreWriting(attemptId),
      WRITING_TIMEOUT_MS,
      'Writing scoring',
    );
  } catch (err) {
    console.error('Error scoring writing:', err);
  }

  try {
    // Score speaking section
    await withTimeout(
      isToeflIbt2026
        ? toeflIbtScoringService.scoreSpeaking(attemptId).then(() => { })
        : aiScoringService.scoreSpeaking(attemptId),
      SPEAKING_TIMEOUT_MS,
      'Speaking scoring',
    );
  } catch (err) {
    console.error('Error scoring speaking:', err);
  }

  let finalized = false;
  // Finalize: calculate overall band and mark as completed
  try {
    await withTimeout(
      aiScoringService.finalizeScoring(attemptId),
      FINALIZE_TIMEOUT_MS,
      'Scoring finalization',
    );
    finalized = true;
  } catch (err) {
    console.error('Error finalizing scoring:', err);
  }

  // Never leave attempts in "scoring" forever, even if finalization fails.
  if (!finalized) {
    try {
      await attemptModel.complete(attemptId);
    } catch (err) {
      console.error('Error forcing attempt completion:', err);
    }
  }

  if (isToeflIbt2026) {
    const refreshed = await attemptModel.findById(attemptId);
    logToeflIbtAuditEvent('toefl_ibt_scoring_pipeline_end', {
      attemptId,
      status: refreshed?.status || null,
      overallBand: refreshed?.overallBand ?? null,
      overallScore120: (refreshed as any)?.overallScore120 ?? null,
      scoreMappingVersion: (refreshed as any)?.scoreMappingVersion ?? null,
    });
  }
}

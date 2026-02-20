import * as attemptModel from '../models/attempt.model';
import * as testModel from '../models/test.model';
import * as userModel from '../models/user.model';
import * as subscriptionModel from '../models/subscription.model';
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

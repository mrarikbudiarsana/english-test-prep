import * as attemptModel from '../models/attempt.model';
import * as testModel from '../models/test.model';
import * as userModel from '../models/user.model';
import * as subscriptionModel from '../models/subscription.model';
import { query, getClient } from '../config/database';
import * as scoringService from './scoring.service';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler';
import { AttemptMode, SectionType } from '../types/test.types';


/** Map a DB test_type to its exam type for subscription checks. */
function testTypeToExamType(_testType: string): string {
  return 'toefl_itp';
}

/**
 * Check whether a user has access to take a test.
 */
export async function checkTestAccess(userId: string, testId: string): Promise<{ canAccess: boolean; reason: string; freeTestsRemaining?: number; requiredExamType?: string }> {
  const test = await testModel.findById(testId);
  if (!test) {
    return { canAccess: false, reason: 'test_not_found' };
  }

  if (test.isFree) {
    return { canAccess: true, reason: 'free_test' };
  }

  const examType = testTypeToExamType(test.testType);
  const activeSub = await subscriptionModel.findActiveByUserIdAndExam(userId, examType);
  if (activeSub) {
    return { canAccess: true, reason: 'has_subscription' };
  }

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
 */
export async function startAttempt(
  userId: string,
  testId: string,
  mode: AttemptMode = 'full',
  practiceSectionType?: SectionType,
) {
  const test = await testModel.findById(testId);
  if (!test || !test.isPublished) {
    throw new NotFoundError('Test not found');
  }

  if (mode === 'section_practice' && !practiceSectionType) {
    throw new ValidationError('Practice section type is required for section practice mode');
  }

  const accessResult = await checkTestAccess(userId, testId);
  if (!accessResult.canAccess) {
    throw new ForbiddenError('You do not have access to this test.');
  }

  if (!test.isFree) {
    const examType = testTypeToExamType(test.testType);
    const activeSub = await subscriptionModel.findActiveByUserIdAndExam(userId, examType);
    if (!activeSub) {
      const updated = await userModel.decrementFreeTests(userId);
      if (!updated) {
        throw new ForbiddenError('No free tests remaining.');
      }
    }
  }

  return attemptModel.create({
    userId,
    testId,
    mode,
    practiceSectionType: practiceSectionType || undefined,
  });
}

/**
 * Get an attempt by ID, ensuring it belongs to the given user.
 */
export async function getAttempt(id: string, userId?: string) {
  const attempt = await attemptModel.findById(id);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }
  if (userId && attempt.userId !== userId) {
    throw new ForbiddenError('You do not have access to this attempt');
  }
  return attempt;
}

/**
 * Get public share info for an attempt.
 */
export async function getShareInfo(id: string) {
  const attempt = await attemptModel.findById(id);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  const sections: { type: string; label: string; score: number }[] = [];
  if (attempt.listeningScore && attempt.listeningScore > 0) {
    sections.push({ type: 'listening', label: 'Listening Comprehension', score: attempt.listeningScore });
  }
  if (attempt.structureScore && attempt.structureScore > 0) {
    sections.push({ type: 'structure', label: 'Structure and Written Expression', score: attempt.structureScore });
  }
  if (attempt.readingScore && attempt.readingScore > 0) {
    sections.push({ type: 'reading', label: 'Reading Comprehension', score: attempt.readingScore });
  }

  const singleSection = attempt.practiceSectionType
    ? sections.find((section) => section.type === attempt.practiceSectionType) ?? null
    : null;

  return {
    testTitle: attempt.test?.title || 'TOEFL ITP Mock Test',
    testType: 'toefl_itp',
    overallScore: attempt.overallScore,
    completedAt: attempt.completedAt,
    isPartialTest: !!singleSection,
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
  mode?: string,
) {
  return attemptModel.findByUserId(userId, offset, limit, ['toefl_itp'], mode);
}

/**
 * Update the current section being taken in an attempt.
 */
export async function updateCurrentSection(attemptId: string, sectionType: SectionType) {
  return attemptModel.updateSection(attemptId, sectionType);
}

/**
 * Submit all responses for a section and trigger objective scoring.
 */
export async function submitSection(attemptId: string, sectionType: SectionType) {
  const attempt = await getAttempt(attemptId);
  if (attempt.status !== 'in_progress') {
    throw new ValidationError('Attempt is not in progress');
  }

  // Objective scoring happens instantly for ITP sections
  await scoringService.scoreObjectiveSection(attemptId, sectionType, 'toefl_itp');

  return { success: true };
}

/**
 * Finalize an attempt, calculate overall score.
 * Wrapped in a DB transaction to prevent inconsistent state if scoring fails midway.
 */
export async function finalizeAttempt(attemptId: string) {
  const attempt = await getAttempt(attemptId);
  if (attempt.status !== 'in_progress') {
    return attempt;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Use the transaction client for all scoring operations
    const txQuery = (text: string, params?: any[]) => client.query(text, params);

    // Ensure all sections are scored before finalizing
    if (attempt.mode === 'full') {
      await scoringService.scoreObjectiveSectionWithQuery(txQuery, attemptId, 'listening', 'toefl_itp');
      await scoringService.scoreObjectiveSectionWithQuery(txQuery, attemptId, 'structure', 'toefl_itp');
      await scoringService.scoreObjectiveSectionWithQuery(txQuery, attemptId, 'reading', 'toefl_itp');
    } else if (attempt.practiceSectionType) {
      await scoringService.scoreObjectiveSectionWithQuery(txQuery, attemptId, attempt.practiceSectionType as SectionType, 'toefl_itp');
    }

    // Re-read scores within the same transaction
    const scoredResult = await txQuery(
      `SELECT listening_score, reading_score, structure_score FROM attempts WHERE id = $1`,
      [attemptId]
    );
    const scored = scoredResult.rows[0];

    if (attempt.mode === 'section_practice') {
      await txQuery(
        `UPDATE attempts SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [attemptId]
      );
    } else {
      // Calculate final ITP score for full tests: (L + S + R) * 10 / 3
      const overallScore = scoringService.calculateOverallBand(
        scored.listening_score,
        scored.reading_score,
        null,
        null,
        scored.structure_score,
        'toefl_itp'
      );

      await txQuery(
        `UPDATE attempts SET overall_score = $1, status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [overallScore, attemptId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Return the finalized attempt
  return getAttempt(attemptId);
}

/**
 * Delete an in-progress or completed attempt.
 */
export async function deleteAttempt(id: string, userId: string) {
  const attempt = await getAttempt(id, userId);
  return attemptModel.remove(id);
}

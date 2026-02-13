import * as attemptModel from '../models/attempt.model';
import * as testModel from '../models/test.model';
import * as userModel from '../models/user.model';
import * as subscriptionModel from '../models/subscription.model';
import * as scoringService from './scoring.service';
import * as aiScoringService from './ai-scoring.service';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler';
import { AttemptMode, SectionType } from '../types/test.types';

/**
 * Check whether a user has access to take a test.
 * Access is granted if:
 *  - The test is free, OR
 *  - The user has an active subscription, OR
 *  - The user has free tests remaining
 */
export async function checkTestAccess(userId: string, testId: string): Promise<boolean> {
  // Check if the test is free
  const test = await testModel.findById(testId);
  if (!test) return false;
  if (test.isFree) return true;

  // Check for an active subscription
  const activeSub = await subscriptionModel.findActiveByUserId(userId);
  if (activeSub) return true;

  // Check for remaining free tests
  const user = await userModel.findById(userId);
  if (user && user.freeTestsRemaining > 0) return true;

  return false;
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
  const hasAccess = await checkTestAccess(userId, testId);
  if (!hasAccess) {
    throw new ForbiddenError(
      'You do not have access to this test. Please subscribe or use your free tests.',
    );
  }

  // If the test is not free and user has no active subscription, decrement free tests
  if (!test.isFree) {
    const activeSub = await subscriptionModel.findActiveByUserId(userId);
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
export async function getAttempt(id: string, userId: string) {
  const attempt = await attemptModel.findById(id);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }
  if (attempt.userId !== userId) {
    throw new ForbiddenError('You do not have access to this attempt');
  }
  return attempt;
}

/**
 * Get all attempts for a user with pagination.
 */
export async function getUserAttempts(userId: string, offset: number = 0, limit: number = 20) {
  return attemptModel.findByUserId(userId, offset, limit);
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
  if (sectionType === 'listening' || sectionType === 'reading') {
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

  // Auto-score listening and reading if not already scored
  if (attempt.listeningBand === null) {
    try {
      await scoringService.scoreObjectiveSection(attemptId, 'listening', test.testType);
    } catch (err) {
      console.error('Error auto-scoring listening:', err);
    }
  }

  if (attempt.readingBand === null) {
    try {
      await scoringService.scoreObjectiveSection(attemptId, 'reading', test.testType);
    } catch (err) {
      console.error('Error auto-scoring reading:', err);
    }
  }

  // Trigger AI scoring asynchronously (do not await)
  triggerAIScoring(attemptId).catch((err) => {
    console.error('Error in AI scoring pipeline:', err);
  });

  return attemptModel.findById(attemptId);
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
  try {
    // Score writing section
    await aiScoringService.scoreWriting(attemptId);
  } catch (err) {
    console.error('Error scoring writing:', err);
  }

  try {
    // Score speaking section
    await aiScoringService.scoreSpeaking(attemptId);
  } catch (err) {
    console.error('Error scoring speaking:', err);
  }

  // Finalize: calculate overall band and mark as completed
  try {
    await aiScoringService.finalizeScoring(attemptId);
  } catch (err) {
    console.error('Error finalizing scoring:', err);
  }
}

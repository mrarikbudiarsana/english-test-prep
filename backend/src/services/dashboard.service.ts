import * as attemptModel from '../models/attempt.model';
import * as subscriptionModel from '../models/subscription.model';

/**
 * Get dashboard statistics for a user.
 * Returns total completed attempts, averages, best score, recent attempts, etc.
 * @param userId - The user's ID
 * @param examType - Optional exam type filter (ielts, toefl_ibt, toefl_itp, pte)
 */
export async function getStats(userId: string, examType?: string) {
  const stats = await attemptModel.getStatsForUser(userId, examType);
  return stats;
}

/**
 * Get attempt history for a user with pagination.
 */
export async function getHistory(userId: string, offset: number = 0, limit: number = 20) {
  return attemptModel.findByUserId(userId, offset, limit);
}

/**
 * Get progress data for a user.
 * Returns recent attempts with their scores for progress tracking.
 */
export async function getProgress(userId: string) {
  const result = await attemptModel.findByUserId(userId, 0, 50);
  const completed = result.rows.filter((a: any) => a.status === 'completed');

  return {
    completedTests: completed.length,
    attempts: completed,
  };
}

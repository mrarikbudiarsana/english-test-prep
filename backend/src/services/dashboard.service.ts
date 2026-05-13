import * as attemptModel from '../models/attempt.model';
import { query } from '../config/database';

/**
 * Get dashboard statistics for a user.
 * Returns total completed attempts, averages, best score, recent attempts, etc.
 * @param userId - The user's ID
 * @param examType - Optional exam type filter (e.g. 'toefl_itp')
 * @param mode - Optional mode filter (full, section)
 */
export async function getStats(userId: string, examType?: string, mode?: string) {
  const stats = await attemptModel.getStatsForUser(userId, examType, mode);
  return stats;
}

/**
 * Get attempt history for a user with pagination.
 */
export async function getHistory(
  userId: string,
  offset: number = 0,
  limit: number = 20,
  mode?: string
) {
  return attemptModel.findByUserId(userId, offset, limit, undefined, mode);
}

/**
 * Get progress data for a user.
 * Returns recent completed attempts with their scores for progress tracking.
 */
export async function getProgress(userId: string) {
  const result = await query(
    `SELECT
       a.id,
       a.overall_score  AS "overallScore",
       a.listening_score AS "listeningScore",
       a.reading_score  AS "readingScore",
       a.structure_score AS "structureScore",
       a.completed_at   AS "completedAt",
       a.mode,
       a.practice_section_type AS "practiceSectionType",
       a.status,
       t.title          AS "testTitle"
     FROM attempts a
     JOIN tests t ON a.test_id = t.id
     WHERE a.user_id = $1 AND a.status = 'completed'
     ORDER BY a.completed_at DESC
     LIMIT 50`,
    [userId],
  );

  return {
    completedTests: result.rows.length,
    attempts: result.rows,
  };
}

import { query } from '../config/database';

// ---------- helpers ----------

const SELECT_COLUMNS = `
  id,
  user_id              AS "userId",
  test_id              AS "testId",
  mode,
  practice_section_type AS "practiceSectionType",
  status,
  started_at           AS "startedAt",
  completed_at         AS "completedAt",
  current_section      AS "currentSection",
  section_started_at   AS "sectionStartedAt",
  listening_raw        AS "listeningRaw",
  listening_band       AS "listeningBand",
  listening_score      AS "listeningScore",
  reading_raw          AS "readingRaw",
  reading_band         AS "readingBand",
  reading_score        AS "readingScore",
  structure_score      AS "structureScore",
  writing_band         AS "writingBand",
  speaking_band        AS "speakingBand",
  overall_band         AS "overallBand",
  overall_score        AS "overallScore",
  writing_feedback     AS "writingFeedback",
  speaking_feedback    AS "speakingFeedback",
  created_at           AS "createdAt",
  updated_at           AS "updatedAt"
`;

const scoreFieldMap: Record<string, string> = {
  listeningRaw: 'listening_raw',
  listeningBand: 'listening_band',
  readingRaw: 'reading_raw',
  readingBand: 'reading_band',
  writingBand: 'writing_band',
  speakingBand: 'speaking_band',
  overallBand: 'overall_band',
  writingFeedback: 'writing_feedback',
  speakingFeedback: 'speaking_feedback',
};

// ---------- queries ----------

function transformAttemptRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    testId: row.test_id,
    mode: row.mode,
    practiceSectionType: row.practice_section_type,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    currentSection: row.current_section,
    sectionStartedAt: row.section_started_at,
    listeningRaw: row.listening_raw,
    listeningBand: row.listening_band,
    listeningScore: row.listening_score,
    readingRaw: row.reading_raw,
    readingBand: row.reading_band,
    readingScore: row.reading_score,
    structureScore: row.structure_score,
    writingBand: row.writing_band,
    speakingBand: row.speaking_band,
    overallBand: row.overall_band,
    overallScore: row.overall_score,
    writingFeedback: row.writing_feedback,
    speakingFeedback: row.speaking_feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    test: row.test || null,
  };
}

export async function findById(id: string) {
  const result = await query(
    `SELECT a.*,
            json_build_object(
              'id', t.id,
              'title', t.title,
              'testType', t.test_type,
              'isPublished', t.is_published,
              'isFree', t.is_free
            ) as test
     FROM attempts a
     JOIN tests t ON a.test_id = t.id
     WHERE a.id = $1`,
    [id],
  );
  if (result.rows.length === 0) return null;
  return transformAttemptRow(result.rows[0]);
}

export async function findByUserId(
  userId: string,
  offset: number = 0,
  limit: number = 20,
  testTypes?: string[],
) {
  const hasTestTypeFilter = !!(testTypes && testTypes.length > 0);
  const testTypeFilter = hasTestTypeFilter ? 'AND t.test_type = ANY($4::text[])' : '';
  const attemptsParams = hasTestTypeFilter
    ? [userId, offset, limit, testTypes]
    : [userId, offset, limit];

  const result = await query(
    `SELECT a.*,
            json_build_object(
              'id', t.id,
              'title', t.title,
              'testType', t.test_type,
              'isPublished', t.is_published,
              'isFree', t.is_free
            ) as test
     FROM attempts a
     JOIN tests t ON a.test_id = t.id
     LEFT JOIN (
       SELECT attempt_id, COUNT(*) as response_count
       FROM responses
       GROUP BY attempt_id
     ) r ON a.id = r.attempt_id
     WHERE a.user_id = $1
       AND (a.status != 'in_progress' OR COALESCE(r.response_count, 0) > 0)
       ${testTypeFilter}
     ORDER BY a.created_at DESC
     OFFSET $2 LIMIT $3`,
    attemptsParams,
  );

  const countTestTypeFilter = hasTestTypeFilter ? 'AND t.test_type = ANY($2::text[])' : '';
  const countParams = hasTestTypeFilter ? [userId, testTypes] : [userId];

  const countResult = await query(
    `SELECT COUNT(*)
     FROM attempts a
     JOIN tests t ON a.test_id = t.id
     LEFT JOIN (
       SELECT attempt_id, COUNT(*) as response_count
       FROM responses
       GROUP BY attempt_id
     ) r ON a.id = r.attempt_id
     WHERE a.user_id = $1
       AND (a.status != 'in_progress' OR COALESCE(r.response_count, 0) > 0)
       ${countTestTypeFilter}`,
    countParams,
  );

  return {
    rows: result.rows.map(transformAttemptRow),
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function create(data: {
  userId: string;
  testId: string;
  mode?: string;
  practiceSectionType?: string;
}) {
  const result = await query(
    `INSERT INTO attempts (user_id, test_id, mode, practice_section_type)
     VALUES ($1, $2, $3, $4)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.userId,
      data.testId,
      data.mode ?? 'full',
      data.practiceSectionType ?? null,
    ],
  );
  return result.rows[0];
}

export async function updateStatus(id: string, status: string) {
  const result = await query(
    `UPDATE attempts
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING ${SELECT_COLUMNS}`,
    [status, id],
  );
  return result.rows[0] || null;
}

export async function updateSection(id: string, currentSection: string) {
  const result = await query(
    `UPDATE attempts
     SET current_section = $1,
         section_started_at = NOW(),
         updated_at = NOW()
     WHERE id = $2
     RETURNING ${SELECT_COLUMNS}`,
    [currentSection, id],
  );
  return result.rows[0] || null;
}

export async function updateScores(
  id: string,
  scores: Partial<{
    listeningRaw: number;
    listeningBand: number;
    readingRaw: number;
    readingBand: number;
    writingBand: number;
    speakingBand: number;
    overallBand: number;
    writingFeedback: any;
    speakingFeedback: any;
  }>,
) {
  const entries = Object.entries(scores).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findById(id);

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of entries) {
    const column = scoreFieldMap[key];
    if (!column) continue;
    const finalValue =
      (key === 'writingFeedback' || key === 'speakingFeedback') && value !== null
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
    `UPDATE attempts
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${SELECT_COLUMNS}`,
    values,
  );
  return result.rows[0] || null;
}

export async function complete(id: string) {
  const result = await query(
    `UPDATE attempts
     SET status = 'completed',
         completed_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [id],
  );
  return result.rows[0] || null;
}

export async function remove(id: string) {
  await query('DELETE FROM attempts WHERE id = $1', [id]);
}

export async function countByUserId(userId: string) {
  const result = await query(
    'SELECT COUNT(*) FROM attempts WHERE user_id = $1',
    [userId],
  );
  return parseInt(result.rows[0].count, 10);
}

export async function countCompletedByUserId(userId: string) {
  const result = await query(
    "SELECT COUNT(*) FROM attempts WHERE user_id = $1 AND status = 'completed'",
    [userId],
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Map exam type preference to actual test types in DB.
 * e.g., 'ielts' maps to ['academic', 'general_training']
 */
const EXAM_TYPE_MAP: Record<string, string[]> = {
  ielts: ['academic', 'general_training'],
  toefl_ibt: ['toefl_ibt'],
  toefl_itp: ['toefl_itp'],
  pte: ['pte_academic'],
};

export async function getStatsForUser(userId: string, examType?: string) {
  // Build test type filter if examType is provided
  const testTypes = examType ? EXAM_TYPE_MAP[examType] : null;
  const testTypeFilter = testTypes
    ? `AND t.test_type = ANY($2::text[])`
    : '';
  const queryParams = testTypes ? [userId, testTypes] : [userId];

  // Get completed attempts with test info
  const attemptsResult = await query(
    `SELECT
      a.id,
      a.user_id AS "userId",
      a.test_id AS "testId",
      a.mode,
      a.practice_section_type AS "practiceSectionType",
      a.status,
      a.started_at AS "startedAt",
      a.completed_at AS "completedAt",
      a.current_section AS "currentSection",
      a.section_started_at AS "sectionStartedAt",
      a.listening_raw AS "listeningRaw",
      a.listening_band AS "listeningBand",
      a.reading_raw AS "readingRaw",
      a.reading_band AS "readingBand",
      a.writing_band AS "writingBand",
      a.speaking_band AS "speakingBand",
      a.overall_band AS "overallBand",
      a.writing_feedback AS "writingFeedback",
      a.speaking_feedback AS "speakingFeedback",
      a.created_at AS "createdAt",
      a.updated_at AS "updatedAt",
      t.title AS "testTitle",
      t.test_type AS "testType"
     FROM attempts a
     JOIN tests t ON a.test_id = t.id
     WHERE a.user_id = $1 AND a.status = 'completed'
     ${testTypeFilter}
     ORDER BY a.completed_at DESC
     LIMIT 10`,
    queryParams,
  );

  const completedAttempts = attemptsResult.rows;

  // Calculate total completed (with exam type filter if provided)
  let totalCompleted: number;
  if (testTypes) {
    const countResult = await query(
      `SELECT COUNT(*) FROM attempts a
       JOIN tests t ON a.test_id = t.id
       WHERE a.user_id = $1 AND a.status = 'completed'
       AND t.test_type = ANY($2::text[])`,
      [userId, testTypes],
    );
    totalCompleted = parseInt(countResult.rows[0].count, 10);
  } else {
    totalCompleted = await countCompletedByUserId(userId);
  }

  // Calculate averages
  const validAttempts = completedAttempts.filter((a: any) => a.overallBand !== null);
  const avgBand = validAttempts.length > 0
    ? validAttempts.reduce((sum: number, a: any) => sum + a.overallBand, 0) / validAttempts.length
    : null;

  const bestBand = validAttempts.length > 0
    ? Math.max(...validAttempts.map((a: any) => a.overallBand))
    : null;

  // Calculate section averages
  const sectionAverages = {
    listening: calculateSectionAverage(completedAttempts, 'listeningBand'),
    reading: calculateSectionAverage(completedAttempts, 'readingBand'),
    writing: calculateSectionAverage(completedAttempts, 'writingBand'),
    speaking: calculateSectionAverage(completedAttempts, 'speakingBand'),
  };

  return {
    totalAttempts: totalCompleted,
    averageBand: avgBand,
    bestBand: bestBand,
    recentAttempts: completedAttempts.map((a: any) => ({
      id: a.id,
      testTitle: a.testTitle,
      overallBand: a.overallBand,
      status: a.status,
      completedAt: a.completedAt,
    })),
    sectionAverages,
  };
}

function calculateSectionAverage(attempts: any[], field: string): number | null {
  const valid = attempts.filter((a) => a[field] !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, a) => sum + a[field], 0) / valid.length;
}

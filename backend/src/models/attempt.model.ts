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
  listening_score      AS "listeningScore",
  reading_raw          AS "readingRaw",
  reading_score        AS "readingScore",
  structure_score      AS "structureScore",
  overall_score        AS "overallScore",
  created_at           AS "createdAt",
  updated_at           AS "updatedAt"
`;

const scoreFieldMap: Record<string, string> = {
  listeningRaw: 'listening_raw',
  listeningScore: 'listening_score',
  readingRaw: 'reading_raw',
  readingScore: 'reading_score',
  structureScore: 'structure_score',
  overallScore: 'overall_score',
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
    listeningScore: row.listening_score,
    readingRaw: row.reading_raw,
    readingScore: row.reading_score,
    structureScore: row.structure_score,
    overallScore: row.overall_score,
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
              'deliveryModel', t.delivery_model,
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
  mode?: string,
) {
  const hasTestTypeFilter = !!(testTypes && testTypes.length > 0);
  const hasModeFilter = !!mode;

  let queryFilter = '';
  const attemptsParams: any[] = [userId, offset, limit];
  let paramCounter = 4;

  if (hasTestTypeFilter) {
    queryFilter += ` AND t.test_type = ANY($${paramCounter}::text[])`;
    attemptsParams.push(testTypes);
    paramCounter++;
  }

  if (hasModeFilter) {
    queryFilter += ` AND a.mode = $${paramCounter}`;
    attemptsParams.push(mode);
    paramCounter++;
  }

  const result = await query(
    `SELECT a.*,
            json_build_object(
              'id', t.id,
              'title', t.title,
              'testType', t.test_type,
              'deliveryModel', t.delivery_model,
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
       ${queryFilter}
     ORDER BY a.created_at DESC
     OFFSET $2 LIMIT $3`,
    attemptsParams,
  );

  const countParams: any[] = [userId];
  let countParamCounter = 2;
  let countFilter = '';

  if (hasTestTypeFilter) {
    countFilter += ` AND t.test_type = ANY($${countParamCounter}::text[])`;
    countParams.push(testTypes);
    countParamCounter++;
  }

  if (hasModeFilter) {
    countFilter += ` AND a.mode = $${countParamCounter}`;
    countParams.push(mode);
    countParamCounter++;
  }

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
       ${countFilter}`,
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
    listeningScore: number;
    readingRaw: number;
    readingScore: number;
    structureScore: number;
    overallScore: number;
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
    setClauses.push(`${column} = $${paramIndex}`);
    values.push(value);
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
 */
const EXAM_TYPE_MAP: Record<string, string[]> = {
  toefl_itp: ['toefl_itp'],
};

export async function getStatsForUser(userId: string, examType?: string, mode?: string) {
  const testTypes = (examType && EXAM_TYPE_MAP[examType]) ? EXAM_TYPE_MAP[examType] : ['toefl_itp'];
  
  let filterClause = 'AND t.test_type = ANY($2::text[])';
  const queryParams: any[] = [userId, testTypes];
  let paramCounter = 3;

  if (mode) {
    filterClause += ` AND a.mode = $${paramCounter}`;
    queryParams.push(mode);
    paramCounter++;
  }

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
      a.listening_score AS "listeningScore",
      a.reading_raw AS "readingRaw",
      a.reading_score AS "readingScore",
      a.structure_score AS "structureScore",
      a.overall_score AS "overallScore",
      a.created_at AS "createdAt",
      a.updated_at AS "updatedAt",
      t.title AS "testTitle",
      t.test_type AS "testType"
     FROM attempts a
     JOIN tests t ON a.test_id = t.id
     WHERE a.user_id = $1 AND a.status = 'completed'
     ${filterClause}
     ORDER BY a.completed_at DESC
     LIMIT 50`,
    queryParams,
  );

  const completedAttempts = attemptsResult.rows;

  const countResult = await query(
    `SELECT COUNT(*) FROM attempts a
     JOIN tests t ON a.test_id = t.id
     WHERE a.user_id = $1 AND a.status = 'completed'
     AND t.test_type = ANY($2::text[])
     ${mode ? `AND a.mode = $3` : ''}`,
    mode ? [userId, testTypes, mode] : [userId, testTypes],
  );
  const totalCompleted = parseInt(countResult.rows[0].count, 10);

  const validAttempts = completedAttempts.filter((a: any) => a.overallScore !== null);
  const avgScore = validAttempts.length > 0
    ? validAttempts.reduce((sum: number, a: any) => sum + (a.overallScore ?? 0), 0) / validAttempts.length
    : null;

  const bestScore = validAttempts.length > 0
    ? Math.max(...validAttempts.map((a: any) => a.overallScore ?? 0))
    : null;

  const sectionAverages = {
    listening: calculateSectionAverage(completedAttempts, 'listeningScore'),
    reading: calculateSectionAverage(completedAttempts, 'readingScore'),
    structure: calculateSectionAverage(completedAttempts, 'structureScore'),
  };

  return {
    totalAttempts: totalCompleted,
    averageBand: avgScore, // Renamed in UI via mapping if needed, but keeping field name for compatibility
    bestBand: bestScore,
    recentAttempts: completedAttempts.map((a: any) => ({
      id: a.id,
      testTitle: a.testTitle,
      overallScore: a.overallScore,
      status: a.status,
      completedAt: a.completedAt,
      mode: a.mode,
    })),
    sectionAverages,
  };
}

function calculateSectionAverage(attempts: any[], field: string): number | null {
  const valid = attempts.filter((a) => a[field] !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, a) => sum + a[field], 0) / valid.length;
}

export async function findAllCompleted(offset: number = 0, limit: number = 50) {
  const result = await query(
    `SELECT
        a.id,
        a.user_id              AS "userId",
        a.test_id              AS "testId",
        a.mode,
        a.status,
        a.started_at           AS "startedAt",
        a.completed_at         AS "completedAt",
        a.listening_score      AS "listeningScore",
        a.reading_score        AS "readingScore",
        a.structure_score      AS "structureScore",
        a.overall_score        AS "overallScore",
        a.created_at           AS "createdAt",
        t.title                AS "testTitle",
        t.test_type            AS "testType",
        u.display_name         AS "userName",
        u.email                AS "userEmail",
        u.photo_url            AS "userPhotoUrl"
     FROM attempts a
     JOIN tests t ON a.test_id = t.id
     JOIN users u ON a.user_id = u.id
     WHERE a.status = 'completed'
     ORDER BY a.completed_at DESC NULLS LAST
     OFFSET $1 LIMIT $2`,
    [offset, limit],
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM attempts WHERE status = 'completed'`,
  );

  return {
    rows: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

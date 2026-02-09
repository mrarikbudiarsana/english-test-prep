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
  reading_raw          AS "readingRaw",
  reading_band         AS "readingBand",
  writing_band         AS "writingBand",
  speaking_band        AS "speakingBand",
  overall_band         AS "overallBand",
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

export async function findById(id: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS} FROM attempts WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function findByUserId(userId: string, offset: number = 0, limit: number = 20) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM attempts
     WHERE user_id = $1
     ORDER BY created_at DESC
     OFFSET $2 LIMIT $3`,
    [userId, offset, limit],
  );

  const countResult = await query(
    'SELECT COUNT(*) FROM attempts WHERE user_id = $1',
    [userId],
  );

  return {
    rows: result.rows,
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

export async function countByUserId(userId: string) {
  const result = await query(
    'SELECT COUNT(*) FROM attempts WHERE user_id = $1',
    [userId],
  );
  return parseInt(result.rows[0].count, 10);
}

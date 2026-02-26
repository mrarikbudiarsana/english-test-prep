import { pool, query } from './config/database';
import { getPteDerivedMaxPoints } from './utils/ptePointRules';

function safeJson(value: unknown): any {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

async function run() {
  const dryRun = process.argv.includes('--dry-run');
  const testIdArg = process.argv.find((arg) => arg.startsWith('--test-id='));
  const testId = testIdArg ? testIdArg.split('=')[1] : null;

  const params: any[] = [];
  let whereExtra = '';
  if (testId) {
    params.push(testId);
    whereExtra = ` AND t.id = $${params.length}`;
  }

  const result = await query(
    `SELECT
       q.id AS "questionId",
       q.question_number AS "questionNumber",
       q.question_type AS "questionType",
       q.points AS "points",
       q.correct_answer AS "correctAnswer",
       s.section_type AS "sectionType",
       s.section_order AS "sectionOrder",
       t.id AS "testId",
       t.title AS "testTitle"
     FROM questions q
     JOIN sections s ON s.id = q.section_id
     JOIN tests t ON t.id = s.test_id
     WHERE t.test_type = 'pte_academic'
       AND q.question_type LIKE 'pte_%'
       ${whereExtra}
     ORDER BY t.title ASC, s.section_order ASC, q.question_number ASC`,
    params,
  );

  const toFix: Array<{
    questionId: string;
    testTitle: string;
    testId: string;
    sectionType: string;
    sectionOrder: number;
    questionNumber: number;
    questionType: string;
    points: number;
    derivedMax: number;
  }> = [];

  for (const row of result.rows) {
    const correctAnswer = safeJson(row.correctAnswer);
    const derived = getPteDerivedMaxPoints(row.questionType, correctAnswer);
    if (derived === null) continue;

    const points = Number(row.points);
    const safePoints = Number.isFinite(points) ? points : 1;
    if (safePoints < derived) {
      toFix.push({
        questionId: row.questionId,
        testTitle: row.testTitle || '(untitled)',
        testId: row.testId,
        sectionType: row.sectionType,
        sectionOrder: Number(row.sectionOrder) || 0,
        questionNumber: Number(row.questionNumber) || 0,
        questionType: row.questionType,
        points: safePoints,
        derivedMax: derived,
      });
    }
  }

  if (toFix.length === 0) {
    console.log('No PTE point mismatches found. Nothing to fix.');
    return;
  }

  console.log(
    `${dryRun ? '[dry-run] ' : ''}Found ${toFix.length} question(s) to normalize:`,
  );
  for (const row of toFix) {
    console.log(
      `- test="${row.testTitle}" testId=${row.testId} section=${row.sectionType}#${row.sectionOrder} ` +
      `q=${row.questionNumber} (${row.questionType}) questionId=${row.questionId} ${row.points} -> ${row.derivedMax}`,
    );
  }

  if (dryRun) {
    console.log('Dry-run mode: no updates applied.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of toFix) {
      await client.query(
        `UPDATE questions
         SET points = $1, updated_at = NOW()
         WHERE id = $2`,
        [row.derivedMax, row.questionId],
      );
    }
    await client.query('COMMIT');
    console.log(`Applied ${toFix.length} points update(s).`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

run()
  .catch((err) => {
    console.error('PTE points fix failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

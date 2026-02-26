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
  const failOnFind = !process.argv.includes('--warn-only');

  const result = await query(
    `SELECT
       q.id AS "questionId",
       q.question_number AS "questionNumber",
       q.question_type AS "questionType",
       q.points AS "points",
       q.correct_answer AS "correctAnswer",
       q.section_id AS "sectionId",
       s.section_type AS "sectionType",
       s.section_order AS "sectionOrder",
       t.id AS "testId",
       t.title AS "testTitle",
       t.test_type AS "testType"
     FROM questions q
     JOIN sections s ON s.id = q.section_id
     JOIN tests t ON t.id = s.test_id
     WHERE t.test_type = 'pte_academic'
       AND q.question_type LIKE 'pte_%'
     ORDER BY t.title ASC, s.section_order ASC, q.question_number ASC`,
  );

  const violations: Array<{
    questionId: string;
    testId: string;
    testTitle: string;
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
      violations.push({
        questionId: row.questionId,
        testId: row.testId,
        testTitle: row.testTitle || '(untitled)',
        sectionType: row.sectionType,
        sectionOrder: Number(row.sectionOrder) || 0,
        questionNumber: Number(row.questionNumber) || 0,
        questionType: row.questionType,
        points: safePoints,
        derivedMax: derived,
      });
    }
  }

  if (violations.length === 0) {
    console.log('PTE points audit passed: no underweighted objective questions found.');
    return;
  }

  console.log(
    `PTE points audit found ${violations.length} underweighted question(s):`,
  );

  for (const v of violations) {
    console.log(
      `- test="${v.testTitle}" testId=${v.testId} section=${v.sectionType}#${v.sectionOrder} ` +
      `q=${v.questionNumber} (${v.questionType}) questionId=${v.questionId} points=${v.points} derivedMax=${v.derivedMax}`,
    );
  }

  if (failOnFind) {
    process.exitCode = 1;
  } else {
    console.log('Audit ran with --warn-only; not failing.');
  }
}

run()
  .catch((err) => {
    console.error('PTE points audit failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

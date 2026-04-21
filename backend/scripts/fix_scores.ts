import { Pool, types } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

types.setTypeParser(1700, (val: any) => parseFloat(val));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
});

const TOEFL_ITP_LISTENING_TABLE = [
  { min: 50, max: 50, band: 68 },
  { min: 49, max: 49, band: 67 },
  { min: 48, max: 48, band: 66 },
  { min: 47, max: 47, band: 65 },
  { min: 45, max: 46, band: 63 },
  { min: 43, max: 44, band: 61 },
  { min: 41, max: 42, band: 59 },
  { min: 39, max: 40, band: 57 },
  { min: 37, max: 38, band: 55 },
  { min: 35, max: 36, band: 54 },
  { min: 33, max: 34, band: 52 },
  { min: 31, max: 32, band: 51 },
  { min: 29, max: 30, band: 50 },
  { min: 27, max: 28, band: 49 },
  { min: 25, max: 26, band: 48 },
  { min: 23, max: 24, band: 47 },
  { min: 21, max: 22, band: 46 },
  { min: 19, max: 20, band: 45 },
  { min: 17, max: 18, band: 44 },
  { min: 15, max: 16, band: 43 },
  { min: 13, max: 14, band: 42 },
  { min: 11, max: 12, band: 41 },
  { min: 9, max: 10, band: 39 },
  { min: 7, max: 8, band: 37 },
  { min: 5, max: 6, band: 35 },
  { min: 3, max: 4, band: 33 },
  { min: 0, max: 2, band: 31 },
];

const TOEFL_ITP_STRUCTURE_TABLE = [
  { min: 40, max: 40, band: 68 },
  { min: 39, max: 39, band: 67 },
  { min: 38, max: 38, band: 65 },
  { min: 37, max: 37, band: 63 },
  { min: 36, max: 36, band: 61 },
  { min: 35, max: 35, band: 60 },
  { min: 34, max: 34, band: 58 },
  { min: 33, max: 33, band: 57 },
  { min: 32, max: 32, band: 56 },
  { min: 31, max: 31, band: 55 },
  { min: 30, max: 30, band: 54 },
  { min: 29, max: 29, band: 53 },
  { min: 28, max: 28, band: 52 },
  { min: 27, max: 27, band: 51 },
  { min: 26, max: 26, band: 50 },
  { min: 25, max: 25, band: 49 },
  { min: 24, max: 24, band: 48 },
  { min: 23, max: 23, band: 47 },
  { min: 21, max: 22, band: 46 },
  { min: 19, max: 20, band: 45 },
  { min: 17, max: 18, band: 44 },
  { min: 15, max: 16, band: 43 },
  { min: 13, max: 14, band: 41 },
  { min: 11, max: 12, band: 40 },
  { min: 9, max: 10, band: 38 },
  { min: 7, max: 8, band: 37 },
  { min: 5, max: 6, band: 35 },
  { min: 4, max: 4, band: 33 },
  { min: 0, max: 3, band: 31 },
];

const TOEFL_ITP_READING_TABLE = [
  { min: 50, max: 50, band: 67 },
  { min: 49, max: 49, band: 66 },
  { min: 48, max: 48, band: 65 },
  { min: 47, max: 47, band: 63 },
  { min: 46, max: 46, band: 61 },
  { min: 45, max: 45, band: 60 },
  { min: 44, max: 44, band: 59 },
  { min: 43, max: 43, band: 58 },
  { min: 42, max: 42, band: 57 },
  { min: 41, max: 41, band: 56 },
  { min: 40, max: 40, band: 55 },
  { min: 39, max: 39, band: 54 },
  { min: 38, max: 38, band: 54 },
  { min: 37, max: 37, band: 53 },
  { min: 36, max: 36, band: 52 },
  { min: 35, max: 35, band: 52 },
  { min: 34, max: 34, band: 51 },
  { min: 33, max: 33, band: 50 },
  { min: 32, max: 32, band: 49 },
  { min: 31, max: 31, band: 48 },
  { min: 29, max: 30, band: 48 },
  { min: 26, max: 28, band: 47 },
  { min: 23, max: 25, band: 46 },
  { min: 20, max: 22, band: 44 },
  { min: 16, max: 19, band: 41 },
  { min: 12, max: 15, band: 37 },
  { min: 8, max: 11, band: 34 },
  { min: 0, max: 7, band: 31 },
];

function convertToBand(rawScore: number, sectionType: string): number {
  let table: Array<{ min: number; max: number; band: number }>;

  if (sectionType === 'listening') {
    table = TOEFL_ITP_LISTENING_TABLE;
  } else if (sectionType === 'structure') {
    table = TOEFL_ITP_STRUCTURE_TABLE;
  } else if (sectionType === 'reading') {
    table = TOEFL_ITP_READING_TABLE;
  } else {
    return 31;
  }

  const match = table.find(r => rawScore >= r.min && rawScore <= r.max);
  return match ? match.band : 31;
}

function unwrapAnswer(value: any): any {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try { return unwrapAnswer(JSON.parse(trimmed)); } catch { }
    }
    return value;
  }
  if (value && typeof value === 'object') {
    if ('answer' in value) return unwrapAnswer(value.answer);
    if ('key' in value) return value.key;
    if ('value' in value) return value.value;
  }
  return value;
}

function normalizeChoice(value: any): string {
  return String(unwrapAnswer(value)).trim().toUpperCase();
}

async function fixPastAttempts() {
  console.log("Starting script to fix historical attempt scores...");

  const res = await pool.query(`
    SELECT a.id, a.mode, a.practice_section_type, a.status
    FROM attempts a
    WHERE a.reading_score IS NULL 
       OR a.listening_score IS NULL 
       OR a.structure_score IS NULL
       OR a.overall_score IS NULL
       OR a.status = 'in_progress'
  `);

  if (res.rows.length === 0) {
    console.log("No attempts found that need fixing based on missing scores.");
    await pool.end();
    return;
  }

  console.log(`Found ${res.rows.length} attempts to inspect/fix.`);
  let fixedCount = 0;

  for (const attempt of res.rows) {
    const responsesResult = await pool.query(
      `SELECT r.id, r.question_id, r.answer_data, r.score, r.is_correct, s.section_type 
       FROM responses r
       JOIN questions q ON q.id = r.question_id
       JOIN sections s ON s.id = q.section_id
       WHERE r.attempt_id = $1`,
      [attempt.id]
    );

    if (responsesResult.rows.length === 0 && attempt.status !== 'completed') {
      continue;
    }

    const sectionTypesToScore = new Set<string>();
    if (attempt.mode === 'full') {
      sectionTypesToScore.add('listening');
      sectionTypesToScore.add('structure');
      sectionTypesToScore.add('reading');
    } else if (attempt.practice_section_type) {
      sectionTypesToScore.add(attempt.practice_section_type);
    }

    let updatedAny = false;
    let scoresMap: Record<string, { raw: number, band: number }> = {};

    for (const sectionType of sectionTypesToScore) {
      const qRes = await pool.query(
        `SELECT q.id, q.question_type, q.correct_answer, q.points
         FROM questions q
         JOIN sections s ON s.id = q.section_id
         JOIN attempts a ON a.test_id = s.test_id
         WHERE a.id = $1 AND s.section_type = $2`,
        [attempt.id, sectionType]
      );
      
      const sectionQuestions = qRes.rows;
      if (sectionQuestions.length === 0) continue;

      let rawScore = 0;
      
      for (const q of sectionQuestions) {
        const response = responsesResult.rows.find(r => r.question_id === q.id);
        if (response) {
          let ans = response.answer_data;
          let isCorrect = false;
          let maxPoints = Number(q.points) > 0 ? Number(q.points) : 1;
          let points = 0;

          if (q.question_type === 'multiple_choice') {
            isCorrect = normalizeChoice(ans) === normalizeChoice(q.correct_answer);
            points = isCorrect ? maxPoints : 0;
          }

          if (points > 0) {
            rawScore += points;
          }

          if (points !== response.score) {
             await pool.query(
               `UPDATE responses SET is_correct = $1, score = $2 WHERE id = $3`,
               [isCorrect, points, response.id]
             );
          }
        }
      }

      const bandScore = convertToBand(rawScore, sectionType);
      scoresMap[sectionType] = { raw: rawScore, band: bandScore };
      
      const rawCol = sectionType + '_raw';
      const scoreCol = sectionType + '_score';
      
      await pool.query(
        `UPDATE attempts SET ${rawCol} = $1, ${scoreCol} = $2 WHERE id = $3`,
        [rawScore, bandScore, attempt.id]
      );
      updatedAny = true;
    }

    if (updatedAny) {
      const finalRes = await pool.query(`SELECT * FROM attempts WHERE id = $1`, [attempt.id]);
      const finalAttempt = finalRes.rows[0];
      
      let overallScore = 310;
      if (attempt.mode === 'full') {
        const l = finalAttempt.listening_score ?? 31;
        const s = finalAttempt.structure_score ?? 31;
        const r = finalAttempt.reading_score ?? 31;
        overallScore = Math.round((l + s + r) * 10 / 3);
      } else {
         const singleScore = scoresMap[attempt.practice_section_type]?.band ?? 31;
         overallScore = singleScore;
      }

      let statusUpdate = "";
      if (attempt.status !== 'completed' && responsesResult.rows.length > 0) {
         statusUpdate = ", status = 'completed', completed_at = NOW()";
      }

      await pool.query(`UPDATE attempts SET overall_score = $1 ${statusUpdate} WHERE id = $2`, [overallScore, attempt.id]);
      fixedCount++;
      console.log(`Successfully recalculated and fixed attempt: ${attempt.id} (overall score: ${overallScore})`);
    }
  }

  console.log(`Done! Fixed ${fixedCount} attempts.`);
  await pool.end();
}

fixPastAttempts().catch(e => {
  console.error("Script failed:", e);
  process.exit(1);
});

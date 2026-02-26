import { pool, query } from './config/database';
import { PTE_OBJECTIVE_MAPPING_VERSION } from './config/pteObjectiveScoreMapping';
import { calculateOverallBand, scoreObjectiveSectionWithQuery } from './services/scoring.service';

type AttemptRow = {
  id: string;
  scoreMappingVersion: string | null;
  listeningBand: number | null;
  readingBand: number | null;
  writingBand: number | null;
  speakingBand: number | null;
};

function toNum(value: any): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function bucketVersion(version: string | null): string {
  if (!version || !version.trim()) return '(null)';
  return version;
}

async function fetchCompletedPteAttempts(): Promise<AttemptRow[]> {
  const res = await query(
    `SELECT
       a.id AS "id",
       a.score_mapping_version AS "scoreMappingVersion",
       a.listening_band AS "listeningBand",
       a.reading_band AS "readingBand",
       a.writing_band AS "writingBand",
       a.speaking_band AS "speakingBand"
     FROM attempts a
     JOIN tests t ON t.id = a.test_id
     WHERE t.test_type = 'pte_academic'
       AND a.status = 'completed'
     ORDER BY a.completed_at ASC NULLS LAST, a.created_at ASC`,
  );

  return res.rows.map((r: any) => ({
    id: r.id,
    scoreMappingVersion: r.scoreMappingVersion ?? null,
    listeningBand: toNum(r.listeningBand),
    readingBand: toNum(r.readingBand),
    writingBand: toNum(r.writingBand),
    speakingBand: toNum(r.speakingBand),
  }));
}

function printVersionSummary(title: string, attempts: AttemptRow[]) {
  const counts = new Map<string, number>();
  for (const a of attempts) {
    const key = bucketVersion(a.scoreMappingVersion);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  console.log(`\n${title}`);
  console.log(`- total_completed_pte_attempts: ${attempts.length}`);
  for (const [version, count] of sorted) {
    console.log(`- ${version}: ${count}`);
  }
}

async function recomputeAttemptObjectiveAndOverall(attemptId: string) {
  await scoreObjectiveSectionWithQuery(query, attemptId, 'listening', 'pte_academic');
  await scoreObjectiveSectionWithQuery(query, attemptId, 'reading', 'pte_academic');

  const refreshed = await query(
    `SELECT
       listening_band AS "listeningBand",
       reading_band AS "readingBand",
       writing_band AS "writingBand",
       speaking_band AS "speakingBand"
     FROM attempts
     WHERE id = $1`,
    [attemptId],
  );

  const row = refreshed.rows[0];
  const overall = calculateOverallBand(
    toNum(row?.listeningBand),
    toNum(row?.readingBand),
    toNum(row?.writingBand),
    toNum(row?.speakingBand),
    null,
    'pte_academic',
  );

  await query(
    `UPDATE attempts
     SET overall_band = $1,
         score_mapping_version = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [overall, PTE_OBJECTIVE_MAPPING_VERSION, attemptId],
  );
}

async function run() {
  const apply = process.argv.includes('--apply');
  const dryRun = !apply || process.argv.includes('--dry-run');
  const recomputeObjective = process.argv.includes('--recompute-objective');

  const before = await fetchCompletedPteAttempts();
  printVersionSummary('Before', before);

  const missing = before.filter((a) => !a.scoreMappingVersion || !a.scoreMappingVersion.trim());
  const legacy = before.filter(
    (a) => a.scoreMappingVersion && a.scoreMappingVersion !== PTE_OBJECTIVE_MAPPING_VERSION,
  );
  const targets = recomputeObjective
    ? before.filter((a) => a.scoreMappingVersion !== PTE_OBJECTIVE_MAPPING_VERSION)
    : missing;

  console.log('\nPlanned actions');
  console.log(`- mode: ${recomputeObjective ? 'recompute-objective+set-version' : 'backfill-missing-version-only'}`);
  console.log(`- execution: ${dryRun ? 'dry-run' : 'apply'}`);
  console.log(`- missing_version: ${missing.length}`);
  console.log(`- legacy_version: ${legacy.length}`);
  console.log(`- target_attempts: ${targets.length}`);

  if (targets.length > 0) {
    const preview = targets.slice(0, 20).map((a) => a.id).join(', ');
    console.log(`- target_preview(first_20_ids): ${preview}`);
  }

  let updated = 0;
  let failed = 0;

  if (!dryRun && targets.length > 0) {
    if (!recomputeObjective) {
      for (const t of targets) {
        try {
          await query(
            `UPDATE attempts
             SET score_mapping_version = $1, updated_at = NOW()
             WHERE id = $2`,
            [PTE_OBJECTIVE_MAPPING_VERSION, t.id],
          );
          updated += 1;
        } catch (err) {
          failed += 1;
          console.error(`Failed to backfill mapping version for attempt ${t.id}:`, err);
        }
      }
    } else {
      for (const t of targets) {
        try {
          await recomputeAttemptObjectiveAndOverall(t.id);
          updated += 1;
        } catch (err) {
          failed += 1;
          console.error(`Failed to recompute attempt ${t.id}:`, err);
        }
      }
    }
  }

  const after = await fetchCompletedPteAttempts();
  printVersionSummary('After', after);

  const afterLegacy = after.filter(
    (a) => a.scoreMappingVersion && a.scoreMappingVersion !== PTE_OBJECTIVE_MAPPING_VERSION,
  ).length;
  const afterMissing = after.filter((a) => !a.scoreMappingVersion || !a.scoreMappingVersion.trim()).length;

  console.log('\nMigration summary');
  console.log(`- updated: ${updated}`);
  console.log(`- failed: ${failed}`);
  console.log(`- remaining_legacy: ${afterLegacy}`);
  console.log(`- remaining_missing: ${afterMissing}`);
  console.log(`- current_version: ${PTE_OBJECTIVE_MAPPING_VERSION}`);
}

run()
  .catch((err) => {
    console.error('PTE mapping migration failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

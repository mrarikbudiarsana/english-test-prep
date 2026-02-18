import * as sectionModel from '../models/section.model';
import * as questionModel from '../models/question.model';
import * as responseModel from '../models/response.model';
import * as attemptModel from '../models/attempt.model';
import { rawToBand } from '../config/toeflIbtScoreMappings';
import { logToeflIbtAuditEvent } from './toefl-ibt-audit.service';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

/**
 * After Stage 1 is complete for a given sectionType:
 * 1. Score Stage 1 responses
 * 2. Determine upper / lower path (>= cutScore% → upper)
 * 3. Store path on the attempt
 * 4. Return the Stage 2 section id for that path
 */
export async function routeSection(
  attemptId: string,
  sectionType: 'reading' | 'listening',
  testId: string,
  cutScorePercent = 60,
): Promise<{ path: 'upper' | 'lower'; stage2SectionId: string }> {
  // 1. Find all sections for this test and sectionType
  const allSections = await sectionModel.findByTestId(testId);
  const typeSections = allSections.filter((s: any) => s.sectionType === sectionType);

  // 2. Find Stage 1 section
  const stage1 = typeSections.find((s: any) => s.moduleStage === 1);
  if (!stage1) {
    throw new ValidationError(`No Stage 1 ${sectionType} section found for test ${testId}`);
  }

  // 3. Get questions for Stage 1
  const questions = await questionModel.findBySectionId(stage1.id);
  const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points ?? 1), 0);

  // 4. Get responses for this attempt + Stage 1 section
  const responses = await responseModel.findByAttemptAndSection(attemptId, stage1.id);

  // 5. Score: sum of correct points
  const earnedPoints = responses.reduce((sum: number, r: any) => {
    if (r.isCorrect) return sum + (r.score ?? 1);
    return sum;
  }, 0);

  const pct = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

  // 6. Determine path
  const path: 'upper' | 'lower' = pct >= cutScorePercent ? 'upper' : 'lower';

  // 7. Find Stage 2 section for this path
  const stage2 = typeSections.find(
    (s: any) => s.moduleStage === 2 && s.modulePath === path,
  );
  if (!stage2) {
    throw new ValidationError(
      `No Stage 2 ${path} ${sectionType} section found for test ${testId}`,
    );
  }

  // 8. Store path on attempt
  const pathField = sectionType === 'reading' ? 'readingPath' : 'listeningPath';
  await attemptModel.updateScores(attemptId, { [pathField]: path } as any);

  logToeflIbtAuditEvent('mst_route_decision', {
    attemptId,
    testId,
    sectionType,
    cutScorePercent,
    earnedPoints,
    totalPoints,
    stage1Percent: pct,
    selectedPath: path,
    stage2SectionId: stage2.id,
  });

  return { path, stage2SectionId: stage2.id };
}

/**
 * After both Stage 1 and Stage 2 are done for a sectionType:
 * Aggregate correct answers across both stages and return raw + band.
 */
export async function scoreSectionComplete(
  attemptId: string,
  sectionType: 'reading' | 'listening',
  testId: string,
): Promise<{ raw: number; band: number }> {
  const allSections = await sectionModel.findByTestId(testId);
  const typeSections = allSections.filter((s: any) => s.sectionType === sectionType);

  // Stage 1 always included
  const stage1 = typeSections.find((s: any) => s.moduleStage === 1);
  if (!stage1) {
    throw new NotFoundError(`No Stage 1 ${sectionType} section found`);
  }

  // Load the stored path for Stage 2
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) throw new NotFoundError('Attempt not found');

  const storedPath = sectionType === 'reading' ? attempt.readingPath : attempt.listeningPath;
  const stage2 = storedPath
    ? typeSections.find((s: any) => s.moduleStage === 2 && s.modulePath === storedPath)
    : null;

  // Sum correct points across Stage 1 (and Stage 2 if available)
  const sectionIds = [stage1.id, ...(stage2 ? [stage2.id] : [])];

  let totalCorrect = 0;
  for (const sectionId of sectionIds) {
    const responses = await responseModel.findByAttemptAndSection(attemptId, sectionId);
    totalCorrect += responses.filter((r: any) => r.isCorrect).length;
  }

  const raw = Math.min(30, totalCorrect);
  const band = rawToBand(raw);

  logToeflIbtAuditEvent('mst_section_scored', {
    attemptId,
    testId,
    sectionType,
    selectedPath: storedPath || null,
    stage1SectionId: stage1.id,
    stage2SectionId: stage2?.id || null,
    totalCorrect,
    raw,
    band,
  });

  return { raw, band };
}

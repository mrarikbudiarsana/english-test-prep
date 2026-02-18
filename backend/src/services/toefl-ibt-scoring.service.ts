import * as attemptModel from '../models/attempt.model';
import * as responseModel from '../models/response.model';
import * as sectionModel from '../models/section.model';
import * as questionModel from '../models/question.model';
import { NotFoundError } from '../middleware/errorHandler';
import { rawToBand, rawToScore30 } from '../config/toeflIbtScoreMappings';

function parseResponseText(response: any): string {
  if (typeof response?.writingText === 'string' && response.writingText.trim().length > 0) {
    return response.writingText.trim();
  }
  const answer = response?.answerData;
  if (typeof answer === 'string') return answer.trim();
  if (answer && typeof answer === 'object' && typeof answer.text === 'string') {
    return answer.text.trim();
  }
  return '';
}

function parseRecordings(response: any): Array<{ duration: number }> {
  const answer = response?.answerData;
  if (!answer || typeof answer !== 'object') {
    return response?.audioUrl ? [{ duration: Number(response?.audioDuration || 0) }] : [];
  }

  const recordings = answer.recordings;
  if (!recordings || typeof recordings !== 'object') {
    return response?.audioUrl ? [{ duration: Number(response?.audioDuration || 0) }] : [];
  }

  return Object.values(recordings)
    .map((rec: any) => ({ duration: Number(rec?.duration || 0) }))
    .filter((rec) => Number.isFinite(rec.duration) && rec.duration >= 0);
}

function normalizeTaskType(sectionTaskType: string | null | undefined, questionTaskType: string | null | undefined) {
  return (sectionTaskType || questionTaskType || '').toLowerCase();
}

function writingBandFromRaw(raw: number): number {
  const scaled30 = rawToScore30((raw / 20) * 30);
  return rawToBand(scaled30);
}

function speakingBandFromRaw(raw: number): number {
  const scaled30 = rawToScore30((raw / 55) * 30);
  return rawToBand(scaled30);
}

export async function scoreWriting(attemptId: string): Promise<void> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) throw new NotFoundError('Attempt not found');

  const sections = await sectionModel.findByTestIdAndType(attempt.testId, 'writing');
  if (sections.length === 0) return;

  let aggregateRaw = 0;

  for (const section of sections) {
    const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);
    const questions = await questionModel.findBySectionId(section.id);
    const firstQuestionTaskType = questions[0]?.itemPayload?.taskType || null;
    const taskType = normalizeTaskType(section.taskType, firstQuestionTaskType);

    if (taskType === 'build_sentence') {
      let sectionRaw = 0;
      for (const response of responses) {
        const text = parseResponseText(response);
        if (text.length > 0) sectionRaw += 1;
      }
      aggregateRaw += Math.min(10, sectionRaw);
      continue;
    }

    // Essay-style writing tasks: write_email / academic_discussion / fallback
    const combined = responses.map(parseResponseText).filter(Boolean).join('\n');
    const wordCount = combined.trim().split(/\s+/).filter(Boolean).length;
    const minWords = section.minWords && section.minWords > 0 ? section.minWords : 100;
    const ratio = minWords > 0 ? wordCount / minWords : 0;

    let sectionRaw = 0;
    if (wordCount === 0) sectionRaw = 0;
    else if (ratio >= 1.2) sectionRaw = 5;
    else if (ratio >= 1.0) sectionRaw = 4;
    else if (ratio >= 0.8) sectionRaw = 3;
    else if (ratio >= 0.6) sectionRaw = 2;
    else if (ratio >= 0.4) sectionRaw = 1;
    else sectionRaw = 0;

    aggregateRaw += sectionRaw;
  }

  const writingRaw = Math.max(0, Math.min(20, Math.round(aggregateRaw)));
  const writingBand = writingBandFromRaw(writingRaw);

  await attemptModel.updateScores(attemptId, {
    writingRaw,
    writingBand,
    writingFeedback: null,
  } as any);
}

export async function scoreSpeaking(attemptId: string): Promise<void> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) throw new NotFoundError('Attempt not found');

  const sections = await sectionModel.findByTestIdAndType(attempt.testId, 'speaking');
  if (sections.length === 0) return;

  let aggregateRaw = 0;

  for (const section of sections) {
    const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);
    const questions = await questionModel.findBySectionId(section.id);
    const firstQuestionTaskType = questions[0]?.itemPayload?.taskType || null;
    const taskType = normalizeTaskType(section.taskType, firstQuestionTaskType);

    const recordingDurations = responses
      .flatMap(parseRecordings)
      .map((rec) => rec.duration);

    const promptCount = Array.isArray(section.speakingPrompts) ? section.speakingPrompts.length : 0;

    if (taskType === 'listen_repeat') {
      const expected = promptCount > 0 ? promptCount : 7;
      const raw = recordingDurations.slice(0, expected).reduce((sum, duration) => {
        if (duration >= 6) return sum + 5;
        if (duration >= 3) return sum + 3;
        if (duration > 0) return sum + 1;
        return sum;
      }, 0);
      aggregateRaw += Math.min(35, raw);
      continue;
    }

    if (taskType === 'take_interview') {
      const expected = promptCount > 0 ? promptCount : 4;
      const raw = recordingDurations.slice(0, expected).reduce((sum, duration) => {
        if (duration >= 30) return sum + 5;
        if (duration >= 18) return sum + 4;
        if (duration >= 10) return sum + 3;
        if (duration >= 5) return sum + 2;
        if (duration > 0) return sum + 1;
        return sum;
      }, 0);
      aggregateRaw += Math.min(20, raw);
      continue;
    }

    // Fallback for unknown taskType: count non-empty recordings as partial credit.
    const fallbackRaw = recordingDurations.reduce((sum, duration) => (duration > 0 ? sum + 2 : sum), 0);
    aggregateRaw += fallbackRaw;
  }

  const speakingRaw = Math.max(0, Math.min(55, Math.round(aggregateRaw)));
  const speakingBand = speakingBandFromRaw(speakingRaw);

  await attemptModel.updateScores(attemptId, {
    speakingRaw,
    speakingBand,
    speakingFeedback: null,
  } as any);
}

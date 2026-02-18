import * as testModel from '../models/test.model';
import * as sectionModel from '../models/section.model';
import * as questionModel from '../models/question.model';
import {
  DEFAULT_TOEFL_IBT_BLUEPRINT,
  type ToeflIbtBlueprint,
} from '../types/toeflBlueprint.types';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

type SectionType = 'reading' | 'listening' | 'writing' | 'speaking';

type ValidationSeverity = 'error' | 'warning';

export interface ToeflIbtBlueprintValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  blueprint: ToeflIbtBlueprint;
}

const READING_TASK_TYPES = new Set(['complete_words', 'read_daily_life', 'read_academic_passage']);
const LISTENING_TASK_TYPES = new Set([
  'listen_choose_response',
  'listen_conversation',
  'listen_announcement',
  'listen_academic_talk',
]);
const WRITING_TASK_TYPES = new Set(['build_sentence', 'write_email', 'academic_discussion']);
const SPEAKING_TASK_TYPES = new Set(['listen_repeat', 'take_interview']);

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pushMessage(
  collection: { errors: string[]; warnings: string[] },
  severity: ValidationSeverity,
  message: string,
) {
  if (severity === 'error') collection.errors.push(message);
  else collection.warnings.push(message);
}

function normalizeBlueprint(input: unknown): ToeflIbtBlueprint {
  if (!isPlainObject(input)) return DEFAULT_TOEFL_IBT_BLUEPRINT;
  return input as ToeflIbtBlueprint;
}

function validateBlueprintShape(blueprint: ToeflIbtBlueprint, messages: { errors: string[]; warnings: string[] }) {
  if (blueprint.deliveryModel !== 'toefl_ibt_2026') {
    pushMessage(messages, 'error', `Blueprint deliveryModel must be "toefl_ibt_2026".`);
  }

  const readingMst = blueprint.sections?.reading?.mst;
  const listeningMst = blueprint.sections?.listening?.mst;
  const writingTasks = blueprint.sections?.writing?.tasks;
  const speakingTasks = blueprint.sections?.speaking?.tasks;

  if (!readingMst || !listeningMst || !writingTasks || !speakingTasks) {
    pushMessage(messages, 'error', 'Blueprint sections are incomplete.');
    return;
  }

  const mstChecks: Array<{ label: string; value: any }> = [
    { label: 'reading.mst.stage1', value: readingMst.stage1 },
    { label: 'reading.mst.stage2', value: readingMst.stage2 },
    { label: 'reading.mst.cutScorePercent', value: readingMst.cutScorePercent },
    { label: 'listening.mst.stage1', value: listeningMst.stage1 },
    { label: 'listening.mst.stage2', value: listeningMst.stage2 },
    { label: 'listening.mst.cutScorePercent', value: listeningMst.cutScorePercent },
  ];

  for (const check of mstChecks) {
    if (!Number.isFinite(check.value) || check.value <= 0) {
      pushMessage(messages, 'error', `Blueprint field ${check.label} must be a positive number.`);
    }
  }

  if (readingMst.cutScorePercent < 1 || readingMst.cutScorePercent > 100) {
    pushMessage(messages, 'error', 'Blueprint reading.mst.cutScorePercent must be between 1 and 100.');
  }
  if (listeningMst.cutScorePercent < 1 || listeningMst.cutScorePercent > 100) {
    pushMessage(messages, 'error', 'Blueprint listening.mst.cutScorePercent must be between 1 and 100.');
  }

  const writingCountTotal =
    (writingTasks.build_sentence?.count || 0) +
    (writingTasks.write_email?.count || 0) +
    (writingTasks.academic_discussion?.count || 0);
  if (writingCountTotal !== 12) {
    pushMessage(messages, 'warning', `Blueprint writing task count is ${writingCountTotal}; expected 12.`);
  }

  const speakingCountTotal =
    (speakingTasks.listen_repeat?.count || 0) +
    (speakingTasks.take_interview?.count || 0);
  if (speakingCountTotal !== 11) {
    pushMessage(messages, 'warning', `Blueprint speaking prompt count is ${speakingCountTotal}; expected 11.`);
  }
}

function resolveTaskType(sectionTaskType: any, itemPayloadTaskType: any): string {
  return String(itemPayloadTaskType || sectionTaskType || '').trim().toLowerCase();
}

function validateTaskTypeForSection(sectionType: SectionType, taskType: string): boolean {
  if (sectionType === 'reading') return READING_TASK_TYPES.has(taskType);
  if (sectionType === 'listening') return LISTENING_TASK_TYPES.has(taskType);
  if (sectionType === 'writing') return WRITING_TASK_TYPES.has(taskType);
  return SPEAKING_TASK_TYPES.has(taskType);
}

function ensureNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateMcqPrompt(messages: { errors: string[]; warnings: string[] }, sectionOrder: number, questionNumber: number, payload: any) {
  const prompt = payload?.prompt;
  const options = prompt?.options;
  if (!ensureNonEmptyString(prompt?.stem)) {
    pushMessage(messages, 'error', `Question ${questionNumber} in section ${sectionOrder} must define prompt.stem.`);
  }
  if (!Array.isArray(options) || options.length < 2) {
    pushMessage(messages, 'error', `Question ${questionNumber} in section ${sectionOrder} must define at least 2 prompt.options.`);
  }
  if (!ensureNonEmptyString(prompt?.correct)) {
    pushMessage(messages, 'error', `Question ${questionNumber} in section ${sectionOrder} must define prompt.correct.`);
  }
}

function validateCompleteWordsPayload(messages: { errors: string[]; warnings: string[] }, sectionOrder: number, questionNumber: number, payload: any) {
  const prompt = payload?.prompt;
  if (!ensureNonEmptyString(prompt?.textTemplate)) {
    pushMessage(
      messages,
      'error',
      `Completion question ${questionNumber} in section ${sectionOrder} must define prompt.textTemplate.`,
    );
  }
  if (!Array.isArray(prompt?.blanks) || prompt.blanks.length === 0) {
    pushMessage(
      messages,
      'error',
      `Completion question ${questionNumber} in section ${sectionOrder} must define prompt.blanks.`,
    );
    return;
  }
  for (const blank of prompt.blanks) {
    if (!ensureNonEmptyString(blank?.id) || !ensureNonEmptyString(blank?.correct)) {
      pushMessage(
        messages,
        'error',
        `Completion question ${questionNumber} in section ${sectionOrder} has a blank with missing id/correct.`,
      );
      break;
    }
  }
}

function validateWriteEmailPayload(messages: { errors: string[]; warnings: string[] }, sectionOrder: number, questionNumber: number, payload: any) {
  const prompt = payload?.prompt;
  if (!ensureNonEmptyString(prompt?.to)) {
    pushMessage(messages, 'error', `write_email question ${questionNumber} in section ${sectionOrder} must define prompt.to.`);
  }
  if (!ensureNonEmptyString(prompt?.subject)) {
    pushMessage(messages, 'error', `write_email question ${questionNumber} in section ${sectionOrder} must define prompt.subject.`);
  }
  if (!Array.isArray(prompt?.instructions) || prompt.instructions.length === 0) {
    pushMessage(messages, 'error', `write_email question ${questionNumber} in section ${sectionOrder} must define prompt.instructions.`);
  }
  if (!Number.isFinite(prompt?.minWords) || Number(prompt.minWords) <= 0) {
    pushMessage(messages, 'error', `write_email question ${questionNumber} in section ${sectionOrder} must define prompt.minWords > 0.`);
  }
}

function validateAcademicDiscussionPayload(messages: { errors: string[]; warnings: string[] }, sectionOrder: number, questionNumber: number, payload: any) {
  const prompt = payload?.prompt;
  if (!ensureNonEmptyString(prompt?.professorPost)) {
    pushMessage(messages, 'error', `academic_discussion question ${questionNumber} in section ${sectionOrder} must define prompt.professorPost.`);
  }
  if (!Array.isArray(prompt?.peerPosts) || prompt.peerPosts.length === 0) {
    pushMessage(messages, 'error', `academic_discussion question ${questionNumber} in section ${sectionOrder} must define prompt.peerPosts.`);
  }
  if (!Number.isFinite(prompt?.minWords) || Number(prompt.minWords) <= 0) {
    pushMessage(messages, 'error', `academic_discussion question ${questionNumber} in section ${sectionOrder} must define prompt.minWords > 0.`);
  }
}

function validateBuildSentencePayload(messages: { errors: string[]; warnings: string[] }, sectionOrder: number, questionNumber: number, payload: any) {
  const prompt = payload?.prompt;
  if (!Array.isArray(prompt?.wordBank) || prompt.wordBank.length < 3) {
    pushMessage(messages, 'error', `build_sentence question ${questionNumber} in section ${sectionOrder} must define prompt.wordBank.`);
  }
  if (!Array.isArray(prompt?.acceptedPatterns) || prompt.acceptedPatterns.length === 0) {
    pushMessage(messages, 'error', `build_sentence question ${questionNumber} in section ${sectionOrder} must define prompt.acceptedPatterns.`);
  }
  if (!Number.isFinite(prompt?.targetSlots) || Number(prompt.targetSlots) <= 0) {
    pushMessage(messages, 'error', `build_sentence question ${questionNumber} in section ${sectionOrder} must define prompt.targetSlots > 0.`);
  }
}

function validateListenRepeatPayload(messages: { errors: string[]; warnings: string[] }, sectionOrder: number, questionNumber: number, payload: any) {
  const prompt = payload?.prompt;
  if (!Array.isArray(prompt?.segments) || prompt.segments.length === 0) {
    pushMessage(messages, 'error', `listen_repeat question ${questionNumber} in section ${sectionOrder} must define prompt.segments.`);
    return;
  }
  for (const segment of prompt.segments) {
    if (!ensureNonEmptyString(segment?.audioUrl)) {
      pushMessage(messages, 'error', `listen_repeat question ${questionNumber} in section ${sectionOrder} has segment with missing audioUrl.`);
      break;
    }
    if (!Number.isFinite(segment?.maxResponseSeconds) || Number(segment.maxResponseSeconds) <= 0) {
      pushMessage(messages, 'error', `listen_repeat question ${questionNumber} in section ${sectionOrder} has segment with invalid maxResponseSeconds.`);
      break;
    }
  }
  if (prompt?.playbackPolicy && String(prompt.playbackPolicy).toLowerCase() !== 'once') {
    pushMessage(messages, 'warning', `listen_repeat question ${questionNumber} in section ${sectionOrder} should use playbackPolicy "once".`);
  }
}

function validateTakeInterviewPayload(messages: { errors: string[]; warnings: string[] }, sectionOrder: number, questionNumber: number, payload: any) {
  const prompt = payload?.prompt;
  if (!Array.isArray(prompt?.questions) || prompt.questions.length === 0) {
    pushMessage(messages, 'error', `take_interview question ${questionNumber} in section ${sectionOrder} must define prompt.questions.`);
    return;
  }
  for (const interviewQuestion of prompt.questions) {
    if (!ensureNonEmptyString(interviewQuestion?.mediaUrl)) {
      pushMessage(messages, 'error', `take_interview question ${questionNumber} in section ${sectionOrder} has prompt question missing mediaUrl.`);
      break;
    }
    if (!Number.isFinite(interviewQuestion?.responseSeconds) || Number(interviewQuestion.responseSeconds) <= 0) {
      pushMessage(messages, 'error', `take_interview question ${questionNumber} in section ${sectionOrder} has prompt question with invalid responseSeconds.`);
      break;
    }
  }
}

export async function validateToeflIbtBlueprint(testId: string): Promise<ToeflIbtBlueprintValidationResult> {
  const test = await testModel.findById(testId);
  if (!test) throw new NotFoundError('Test not found');
  if (test.testType !== 'toefl_ibt' || test.deliveryModel !== 'toefl_ibt_2026') {
    throw new ValidationError('Blueprint validation is only available for TOEFL iBT 2026 tests');
  }

  const blueprint = normalizeBlueprint((test as any).blueprintJson);
  const messages = { errors: [] as string[], warnings: [] as string[] };

  validateBlueprintShape(blueprint, messages);

  const sections = await sectionModel.findByTestId(testId);
  const grouped = {
    reading: sections.filter((s: any) => s.sectionType === 'reading'),
    listening: sections.filter((s: any) => s.sectionType === 'listening'),
    writing: sections.filter((s: any) => s.sectionType === 'writing'),
    speaking: sections.filter((s: any) => s.sectionType === 'speaking'),
  };

  (['reading', 'listening', 'writing', 'speaking'] as SectionType[]).forEach((type) => {
    if (grouped[type].length === 0) {
      pushMessage(messages, 'error', `Missing required section type: ${type}.`);
    }
  });

  for (const type of ['reading', 'listening'] as SectionType[]) {
    const stage1 = grouped[type].filter((s: any) => (s.moduleStage ?? null) === 1);
    const stage2Upper = grouped[type].filter((s: any) => s.moduleStage === 2 && s.modulePath === 'upper');
    const stage2Lower = grouped[type].filter((s: any) => s.moduleStage === 2 && s.modulePath === 'lower');

    if (stage1.length !== 1) {
      pushMessage(messages, 'error', `${type} must have exactly one Stage 1 section (found ${stage1.length}).`);
    }
    if (stage2Upper.length === 0) {
      pushMessage(messages, 'error', `${type} must have at least one Stage 2 upper section.`);
    }
    if (stage2Lower.length === 0) {
      pushMessage(messages, 'error', `${type} must have at least one Stage 2 lower section.`);
    }

    const expectedStage1 = type === 'reading'
      ? (blueprint.sections?.reading?.mst?.stage1 ?? 20)
      : (blueprint.sections?.listening?.mst?.stage1 ?? 20);
    const expectedStage2 = type === 'reading'
      ? (blueprint.sections?.reading?.mst?.stage2 ?? 15)
      : (blueprint.sections?.listening?.mst?.stage2 ?? 15);

    const stage1Section = stage1[0];
    if (stage1Section) {
      const stage1Questions = await questionModel.findBySectionId(stage1Section.id);
      if (stage1Questions.length !== expectedStage1) {
        pushMessage(
          messages,
          'error',
          `${type} Stage 1 section ${stage1Section.sectionOrder} has ${stage1Questions.length} items; expected ${expectedStage1}.`,
        );
      }
    }

    for (const s2 of [...stage2Upper, ...stage2Lower]) {
      const s2Questions = await questionModel.findBySectionId(s2.id);
      if (s2Questions.length !== expectedStage2) {
        pushMessage(
          messages,
          'error',
          `${type} Stage 2 ${s2.modulePath} section ${s2.sectionOrder} has ${s2Questions.length} items; expected ${expectedStage2}.`,
        );
      }
    }
  }

  const writingByTask = {
    build_sentence: 0,
    write_email: 0,
    academic_discussion: 0,
  };
  const speakingByTask = {
    listen_repeat: 0,
    take_interview: 0,
  };

  for (const section of sections as any[]) {
    if (!['reading', 'listening', 'writing', 'speaking'].includes(section.sectionType)) continue;

    const questions = await questionModel.findBySectionId(section.id);
    if (questions.length === 0) {
      pushMessage(
        messages,
        'error',
        `Section ${section.sectionOrder} (${section.sectionType}) has no items/questions.`,
      );
      continue;
    }

    if (section.sectionType === 'writing') {
      const taskType = String(section.taskType || '').toLowerCase();
      if (!WRITING_TASK_TYPES.has(taskType)) {
        pushMessage(
          messages,
          'error',
          `Writing section ${section.sectionOrder} has invalid or missing taskType.`,
        );
      } else if (taskType === 'build_sentence') {
        writingByTask.build_sentence += questions.length;
      } else if (taskType === 'write_email') {
        writingByTask.write_email += 1;
      } else if (taskType === 'academic_discussion') {
        writingByTask.academic_discussion += 1;
      }

      if ((taskType === 'write_email' || taskType === 'academic_discussion') && (!section.minWords || section.minWords <= 0)) {
        pushMessage(
          messages,
          'error',
          `Writing section ${section.sectionOrder} (${taskType}) must define minWords.`,
        );
      }
    }

    if (section.sectionType === 'speaking') {
      const taskType = String(section.taskType || '').toLowerCase();
      if (!SPEAKING_TASK_TYPES.has(taskType)) {
        pushMessage(
          messages,
          'error',
          `Speaking section ${section.sectionOrder} has invalid or missing taskType.`,
        );
      } else {
        const promptCount = Array.isArray(section.speakingPrompts) ? section.speakingPrompts.length : 0;
        if (taskType === 'listen_repeat') speakingByTask.listen_repeat += promptCount;
        if (taskType === 'take_interview') speakingByTask.take_interview += promptCount;
      }
    }

    for (const q of questions as any[]) {
      if (!isPlainObject(q.itemPayload)) {
        pushMessage(messages, 'error', `Question ${q.questionNumber} in section ${section.sectionOrder} is missing itemPayload.`);
        continue;
      }

      const itemTaskType = resolveTaskType(section.taskType, q.itemPayload?.taskType);
      if (!itemTaskType) {
        pushMessage(messages, 'error', `Question ${q.questionNumber} in section ${section.sectionOrder} is missing taskType.`);
        continue;
      }

      if (!validateTaskTypeForSection(section.sectionType, itemTaskType)) {
        pushMessage(
          messages,
          'error',
          `Question ${q.questionNumber} in section ${section.sectionOrder} has invalid taskType "${itemTaskType}" for ${section.sectionType}.`,
        );
      }

      if (section.sectionType === 'listening') {
        const hasAudio = Boolean(section.audioUrl || q.audioUrl || q.itemPayload?.prompt?.audio?.url);
        if (!hasAudio) {
          pushMessage(messages, 'error', `Listening question ${q.questionNumber} in section ${section.sectionOrder} has no audio source.`);
        }
      }

      if (q.questionType === 'completion' && !Array.isArray(q.itemPayload?.prompt?.blanks)) {
        pushMessage(
          messages,
          'error',
          `Completion question ${q.questionNumber} in section ${section.sectionOrder} is missing itemPayload.prompt.blanks.`,
        );
      }

      switch (itemTaskType) {
        case 'complete_words':
          validateCompleteWordsPayload(messages, section.sectionOrder, q.questionNumber, q.itemPayload);
          break;
        case 'read_daily_life':
        case 'read_academic_passage':
        case 'listen_choose_response':
        case 'listen_conversation':
        case 'listen_announcement':
        case 'listen_academic_talk':
          validateMcqPrompt(messages, section.sectionOrder, q.questionNumber, q.itemPayload);
          break;
        case 'build_sentence':
          validateBuildSentencePayload(messages, section.sectionOrder, q.questionNumber, q.itemPayload);
          break;
        case 'write_email':
          validateWriteEmailPayload(messages, section.sectionOrder, q.questionNumber, q.itemPayload);
          break;
        case 'academic_discussion':
          validateAcademicDiscussionPayload(messages, section.sectionOrder, q.questionNumber, q.itemPayload);
          break;
        case 'listen_repeat':
          validateListenRepeatPayload(messages, section.sectionOrder, q.questionNumber, q.itemPayload);
          break;
        case 'take_interview':
          validateTakeInterviewPayload(messages, section.sectionOrder, q.questionNumber, q.itemPayload);
          break;
        default:
          break;
      }
    }
  }

  const expectedBuildSentence = blueprint.sections?.writing?.tasks?.build_sentence?.count ?? 10;
  const expectedWriteEmail = blueprint.sections?.writing?.tasks?.write_email?.count ?? 1;
  const expectedAcademicDiscussion = blueprint.sections?.writing?.tasks?.academic_discussion?.count ?? 1;
  const expectedListenRepeat = blueprint.sections?.speaking?.tasks?.listen_repeat?.count ?? 7;
  const expectedTakeInterview = blueprint.sections?.speaking?.tasks?.take_interview?.count ?? 4;

  if (writingByTask.build_sentence !== expectedBuildSentence) {
    pushMessage(
      messages,
      'error',
      `build_sentence item count is ${writingByTask.build_sentence}; expected ${expectedBuildSentence}.`,
    );
  }
  if (writingByTask.write_email !== expectedWriteEmail) {
    pushMessage(
      messages,
      'error',
      `write_email task count is ${writingByTask.write_email}; expected ${expectedWriteEmail}.`,
    );
  }
  if (writingByTask.academic_discussion !== expectedAcademicDiscussion) {
    pushMessage(
      messages,
      'error',
      `academic_discussion task count is ${writingByTask.academic_discussion}; expected ${expectedAcademicDiscussion}.`,
    );
  }
  if (speakingByTask.listen_repeat !== expectedListenRepeat) {
    pushMessage(
      messages,
      'error',
      `listen_repeat prompt count is ${speakingByTask.listen_repeat}; expected ${expectedListenRepeat}.`,
    );
  }
  if (speakingByTask.take_interview !== expectedTakeInterview) {
    pushMessage(
      messages,
      'error',
      `take_interview prompt count is ${speakingByTask.take_interview}; expected ${expectedTakeInterview}.`,
    );
  }

  return {
    valid: messages.errors.length === 0,
    errors: messages.errors,
    warnings: messages.warnings,
    blueprint,
  };
}

export async function upsertToeflIbtBlueprint(testId: string, blueprintInput: unknown) {
  const test = await testModel.findById(testId);
  if (!test) throw new NotFoundError('Test not found');
  if (test.testType !== 'toefl_ibt' || test.deliveryModel !== 'toefl_ibt_2026') {
    throw new ValidationError('Blueprint update is only available for TOEFL iBT 2026 tests');
  }

  const candidate = normalizeBlueprint(blueprintInput);
  const shapeMessages = { errors: [] as string[], warnings: [] as string[] };
  validateBlueprintShape(candidate, shapeMessages);
  if (shapeMessages.errors.length > 0) {
    throw new ValidationError(`Invalid blueprint: ${shapeMessages.errors.join(' | ')}`);
  }

  return testModel.update(testId, { blueprintJson: candidate });
}

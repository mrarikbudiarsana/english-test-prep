import * as testModel from '../models/test.model';
import * as sectionModel from '../models/section.model';
import * as questionModel from '../models/question.model';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { DEFAULT_TOEFL_IBT_BLUEPRINT } from '../types/toeflBlueprint.types';
import {
  upsertToeflIbtBlueprint,
  validateToeflIbtBlueprint,
} from './toefl-ibt-blueprint.service';
import { validatePteQuestionPayload } from '../utils/pteQuestionValidator';
import { validatePteConfiguredPoints } from '../utils/ptePointRules';
import { previewPteBlueprint } from '../utils/pteBlueprintValidator';

export interface PtePublishIssue {
  type: 'section' | 'question' | 'speaking_prompt' | 'blueprint';
  message: string;
  sectionType?: string;
  sectionOrder?: number;
  questionNumber?: number;
  questionType?: string;
  promptIndex?: number;
}

async function validatePteAcademicForPublish(testId: string): Promise<{
  errors: string[];
  issues: PtePublishIssue[];
}> {
  const errors: string[] = [];
  const issues: PtePublishIssue[] = [];
  const expectedFlow = ['speaking', 'reading', 'listening'];
  const durationRules: Record<string, { min: number; max: number }> = {
    speaking: { min: 76, max: 84 },
    reading: { min: 23, max: 30 },
    listening: { min: 31, max: 39 },
  };

  const sections = await sectionModel.findByTestId(testId);
  if (sections.length !== 3) {
    const message = 'PTE Academic must have exactly 3 sections';
    errors.push(message);
    issues.push({ type: 'section', message });
    return { errors, issues };
  }

  sections.forEach((s, idx) => {
    const expectedType = expectedFlow[idx];
    if (s.sectionType !== expectedType) {
      const message = `Section ${idx + 1} must be "${expectedType}"`;
      errors.push(message);
      issues.push({
        type: 'section',
        message,
        sectionType: s.sectionType,
        sectionOrder: idx + 1,
      });
    }
    const rule = durationRules[s.sectionType];
    if (rule && (s.durationMinutes < rule.min || s.durationMinutes > rule.max)) {
      const message = `Section "${s.sectionType}" duration must be between ${rule.min}-${rule.max} minutes`;
      errors.push(message);
      issues.push({
        type: 'section',
        message,
        sectionType: s.sectionType,
        sectionOrder: s.sectionOrder,
      });
    }
  });

  const questions = await questionModel.findByTestId(testId);
  const pteQuestions = questions.filter((q: any) => String(q.questionType).startsWith('pte_'));

  if (pteQuestions.length === 0) {
    const message = 'PTE Academic test must include PTE question items';
    errors.push(message);
    issues.push({ type: 'question', message });
  }

  for (const q of pteQuestions) {
    const result = validatePteQuestionPayload(q.questionType, q.questionData, q.correctAnswer);
    if (!result.valid) {
      const message = `Question #${q.questionNumber} (${q.questionType}): ${result.errors.join(', ')}`;
      errors.push(message);
      issues.push({
        type: 'question',
        message,
        sectionType: q.sectionType,
        questionNumber: q.questionNumber,
        questionType: q.questionType,
      });
    }
    const pointsError = validatePteConfiguredPoints(q.questionType, q.correctAnswer, q.points);
    if (pointsError) {
      const message = `Question #${q.questionNumber} (${q.questionType}): ${pointsError}`;
      errors.push(message);
      issues.push({
        type: 'question',
        message,
        sectionType: q.sectionType,
        questionNumber: q.questionNumber,
        questionType: q.questionType,
      });
    }

    const requiresListeningMedia =
      q.sectionType === 'listening' &&
      ['pte_mcq_multiple', 'pte_mcq_single', 'pte_highlight_correct_summary', 'pte_select_missing_word'].includes(q.questionType);
    if (requiresListeningMedia && !String(q.audioUrl || '').trim()) {
      const message = `Question #${q.questionNumber} (${q.questionType}) in listening must include media (audio/video)`;
      errors.push(message);
      issues.push({
        type: 'question',
        message,
        sectionType: q.sectionType,
        questionNumber: q.questionNumber,
        questionType: q.questionType,
      });
    }
  }

  const speakingMediaRequiredTasks = new Set([
    'repeat_sentence',
    'retell_lecture',
    'answer_short_question',
    'summarize_group_discussion',
  ]);

  const speakingSections = (sections as any[]).filter((s) => s.sectionType === 'speaking');
  for (const section of speakingSections) {
    const taskType = String(section?.taskType || '').trim();
    if (!taskType) continue;

    let prompts: any[] = [];
    const rawPrompts = section?.speakingPrompts;
    if (Array.isArray(rawPrompts)) {
      prompts = rawPrompts;
    } else if (typeof rawPrompts === 'string') {
      try {
        const parsed = JSON.parse(rawPrompts);
        if (Array.isArray(parsed)) prompts = parsed;
      } catch {
        prompts = [];
      }
    }

    prompts.forEach((prompt: any, idx: number) => {
      const media = String(prompt?.mediaUrl || prompt?.audioUrl || '').trim();
      const image = String(prompt?.imageUrl || '').trim();
      const promptLabel = `Speaking section ${section.sectionOrder} prompt ${idx + 1} (${taskType})`;

      if (speakingMediaRequiredTasks.has(taskType) && !media) {
        const message = `${promptLabel} must include media (audio/video)`;
        errors.push(message);
        issues.push({
          type: 'speaking_prompt',
          message,
          sectionType: 'speaking',
          sectionOrder: section.sectionOrder,
          promptIndex: idx + 1,
        });
      }

      if (taskType === 'describe_image' && !image) {
        const message = `${promptLabel} must include image`;
        errors.push(message);
        issues.push({
          type: 'speaking_prompt',
          message,
          sectionType: 'speaking',
          sectionOrder: section.sectionOrder,
          promptIndex: idx + 1,
        });
      }

    });
  }

  return { errors, issues };
}

/**
 * Get all published tests with pagination.
 * @param offset - Pagination offset
 * @param limit - Pagination limit
 * @param testTypes - Optional array of test types to filter by
 */
export async function getPublishedTests(
  offset: number = 0,
  limit: number = 20,
  testTypes?: string[],
) {
  return testModel.findAll({ isPublished: true, testTypes }, offset, limit);
}

/**
 * Get a test by its ID. Throws NotFoundError if not found.
 */
export async function getTestById(id: string) {
  const test = await testModel.findById(id);
  if (!test) {
    throw new NotFoundError('Test not found');
  }
  return test;
}

/**
 * Get a test along with its sections (joined).
 * Returns the test object with a `sections` array attached.
 */
export async function getTestWithSections(id: string) {
  const test = await testModel.findById(id);
  if (!test) {
    throw new NotFoundError('Test not found');
  }

  const sections = await sectionModel.findByTestId(id);

  return {
    ...test,
    sections,
  };
}

/**
 * Admin: Create a new test.
 * TOEFL iBT tests are gated behind the ENABLE_TOEFL_IBT_2026 feature flag
 * and always use the 'toefl_ibt_2026' delivery model.
 */
export async function createTest(
  data: {
    title: string;
    description?: string;
    testType: string;
    isFree?: boolean;
  },
  createdBy: string,
) {
  let deliveryModel = 'legacy';

  if (data.testType === 'toefl_ibt') {
    if (!env.enableToeflIbt2026) {
      throw new ValidationError('TOEFL iBT is not yet enabled on this platform');
    }
    deliveryModel = 'toefl_ibt_2026';
  }

  return testModel.create({
    title: data.title,
    description: data.description,
    testType: data.testType,
    deliveryModel,
    blueprintJson: data.testType === 'toefl_ibt' ? DEFAULT_TOEFL_IBT_BLUEPRINT : null,
    isFree: data.isFree,
    createdBy,
  });
}

/**
 * Admin: Update an existing test.
 */
export async function updateTest(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    testType: string;
    isPublished: boolean;
    isFree: boolean;
    durationMinutes: number;
  }>,
) {
  const existing = await testModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Test not found');
  }

  return testModel.update(id, data);
}

/**
 * Admin: Delete a test.
 */
export async function deleteTest(id: string) {
  const existing = await testModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Test not found');
  }

  const deleted = await testModel.remove(id);
  if (!deleted) {
    throw new NotFoundError('Test not found');
  }

  return { success: true };
}

/**
 * Admin: Toggle the is_published status of a test.
 */
export async function publishTest(id: string, publish: boolean) {
  const existing = await testModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Test not found');
  }

  if (
    publish &&
    existing.testType === 'toefl_ibt' &&
    existing.deliveryModel === 'toefl_ibt_2026'
  ) {
    const validation = await validateToeflIbtBlueprint(id);
    if (!validation.valid) {
      throw new ValidationError(
        `Cannot publish TOEFL iBT 2026 test: ${validation.errors.join(' | ')}`
      );
    }
  }

  if (publish && existing.testType === 'pte_academic') {
    const ptePublishValidation = await validatePteAcademicForPublish(id);
    const errors = [...ptePublishValidation.errors];
    const freshBlueprintValidation = await validatePteBlueprintForTest(id);
    if (!freshBlueprintValidation.valid) {
      errors.push(...freshBlueprintValidation.errors);
    }
    if (errors.length > 0) {
      throw new ValidationError(`Cannot publish PTE Academic test: ${errors.join(' | ')}`);
    }
  }

  return testModel.publish(id, publish);
}

export async function setToeflIbtBlueprint(testId: string, blueprint: unknown) {
  return upsertToeflIbtBlueprint(testId, blueprint);
}

export async function validateToeflIbtBlueprintForTest(testId: string) {
  return validateToeflIbtBlueprint(testId);
}

export async function validatePteBlueprintForTest(testId: string) {
  const test = await testModel.findById(testId);
  if (!test) {
    throw new NotFoundError('Test not found');
  }
  if (test.testType !== 'pte_academic') {
    throw new ValidationError('PTE blueprint validation is only available for PTE Academic tests');
  }

  const questions = await questionModel.findByTestId(testId);
  return previewPteBlueprint(questions);
}

export async function validatePtePublishForTest(testId: string) {
  const test = await testModel.findById(testId);
  if (!test) {
    throw new NotFoundError('Test not found');
  }
  if (test.testType !== 'pte_academic') {
    throw new ValidationError('PTE publish validation is only available for PTE Academic tests');
  }

  const ptePublishValidation = await validatePteAcademicForPublish(testId);
  const blueprintValidation = await validatePteBlueprintForTest(testId);
  const blueprintIssues: PtePublishIssue[] = (blueprintValidation.errors || []).map((message) => ({
    type: 'blueprint',
    message,
  }));

  return {
    valid: ptePublishValidation.errors.length === 0 && blueprintValidation.valid,
    errors: [...ptePublishValidation.errors, ...(blueprintValidation.errors || [])],
    issues: [...ptePublishValidation.issues, ...blueprintIssues],
    blueprint: blueprintValidation,
  };
}

import * as testModel from '../models/test.model';
import * as sectionModel from '../models/section.model';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { DEFAULT_TOEFL_IBT_BLUEPRINT } from '../types/toeflBlueprint.types';
import {
  upsertToeflIbtBlueprint,
  validateToeflIbtBlueprint,
} from './toefl-ibt-blueprint.service';

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

  return testModel.publish(id, publish);
}

export async function setToeflIbtBlueprint(testId: string, blueprint: unknown) {
  return upsertToeflIbtBlueprint(testId, blueprint);
}

export async function validateToeflIbtBlueprintForTest(testId: string) {
  return validateToeflIbtBlueprint(testId);
}

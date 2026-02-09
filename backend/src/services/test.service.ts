import * as testModel from '../models/test.model';
import * as sectionModel from '../models/section.model';
import { NotFoundError } from '../middleware/errorHandler';

/**
 * Get all published tests with pagination.
 */
export async function getPublishedTests(offset: number = 0, limit: number = 20) {
  return testModel.findAll({ isPublished: true }, offset, limit);
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
  return testModel.create({
    title: data.title,
    description: data.description,
    testType: data.testType,
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

  return testModel.publish(id, publish);
}

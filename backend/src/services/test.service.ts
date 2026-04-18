import * as testModel from '../models/test.model';
import * as sectionModel from '../models/section.model';
import { NotFoundError } from '../middleware/errorHandler';

export async function getPublishedTests(
  offset: number = 0,
  limit: number = 20,
  testTypes?: string[],
) {
  return testModel.findAll({ isPublished: true, testTypes }, offset, limit);
}

export async function getTestById(id: string) {
  const test = await testModel.findById(id);
  if (!test) {
    throw new NotFoundError('Test not found');
  }
  return test;
}

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

export async function createTest(
  data: {
    title: string;
    description?: string;
    testType: string;
    isFree?: boolean;
    durationMinutes?: number;
  },
  createdBy: string,
) {
  return testModel.create({
    title: data.title,
    description: data.description,
    testType: data.testType,
    deliveryModel: 'legacy',
    blueprintJson: null,
    isFree: data.isFree,
    durationMinutes: data.durationMinutes,
    createdBy,
  });
}

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

export async function publishTest(id: string, publish: boolean) {
  const existing = await testModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Test not found');
  }

  return testModel.publish(id, publish);
}

import * as testModel from '../models/test.model';
import * as sectionModel from '../models/section.model';
import { NotFoundError } from '../middleware/errorHandler';
import { cache, CACHE_KEYS, clearTestCaches } from '../utils/cache';

export async function getPublishedTests(
  offset: number = 0,
  limit: number = 20,
  testTypes?: string[],
) {
  const cacheKey = CACHE_KEYS.PUBLISHED_TESTS(limit, offset) + (testTypes ? '_' + testTypes.join('-') : '');
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await testModel.findAll({ isPublished: true, testTypes }, offset, limit);
  cache.set(cacheKey, result);
  return result;
}

export async function getTestById(id: string) {
  const cacheKey = CACHE_KEYS.TEST_BY_ID(id);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const test = await testModel.findById(id);
  if (!test) {
    throw new NotFoundError('Test not found');
  }
  cache.set(cacheKey, test);
  return test;
}

export async function getTestWithSections(id: string) {
  const cacheKey = CACHE_KEYS.TEST_WITH_SECTIONS(id);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const test = await testModel.findById(id);
  if (!test) {
    throw new NotFoundError('Test not found');
  }

  const sections = await sectionModel.findByTestId(id);

  const result = {
    ...test,
    sections,
  };
  cache.set(cacheKey, result);
  return result;
}

export async function createTest(
  data: {
    title: string;
    description?: string;
    testType: string;
    isFree?: boolean;
    durationMinutes?: number;
    audioThinkingTime?: number;
  },
  createdBy: string,
) {
  const result = await testModel.create({
    title: data.title,
    description: data.description,
    testType: data.testType,
    deliveryModel: 'legacy',
    blueprintJson: null,
    isFree: data.isFree,
    durationMinutes: data.durationMinutes,
    audioThinkingTime: data.audioThinkingTime,
    createdBy,
  });
  clearTestCaches();
  return result;
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
    audioThinkingTime: number;
  }>,
) {
  const existing = await testModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Test not found');
  }

  const result = await testModel.update(id, data);
  clearTestCaches();
  return result;
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

  clearTestCaches();
  return { success: true };
}

export async function publishTest(id: string, publish: boolean) {
  const existing = await testModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Test not found');
  }

  const result = await testModel.publish(id, publish);
  clearTestCaches();
  return result;
}

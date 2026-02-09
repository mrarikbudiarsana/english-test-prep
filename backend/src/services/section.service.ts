import * as sectionModel from '../models/section.model';
import * as testModel from '../models/test.model';
import { NotFoundError } from '../middleware/errorHandler';

/**
 * Get all sections for a given test, ordered by section_order.
 */
export async function getSectionsByTestId(testId: string) {
  // Verify the test exists
  const test = await testModel.findById(testId);
  if (!test) {
    throw new NotFoundError('Test not found');
  }

  return sectionModel.findByTestId(testId);
}

/**
 * Get a single section by its ID. Throws NotFoundError if not found.
 */
export async function getSectionById(id: string) {
  const section = await sectionModel.findById(id);
  if (!section) {
    throw new NotFoundError('Section not found');
  }
  return section;
}

/**
 * Create a new section for a test.
 * Automatically assigns the next section_order value.
 */
export async function createSection(
  testId: string,
  data: {
    sectionType: string;
    title?: string;
    instructions?: string;
    durationMinutes: number;
    audioUrl?: string;
    passageText?: string;
    passageTitle?: string;
    taskDescription?: string;
    taskNumber?: number;
    minWords?: number;
    imageUrl?: string;
    partNumber?: number;
    speakingPrompts?: any;
    preparationTime?: number;
    responseTime?: number;
  },
) {
  // Verify the test exists
  const test = await testModel.findById(testId);
  if (!test) {
    throw new NotFoundError('Test not found');
  }

  // Auto-assign the next section_order
  const maxOrder = await sectionModel.getMaxOrder(testId);
  const sectionOrder = maxOrder + 1;

  return sectionModel.create({
    testId,
    sectionOrder,
    sectionType: data.sectionType,
    title: data.title,
    instructions: data.instructions,
    durationMinutes: data.durationMinutes,
    audioUrl: data.audioUrl,
    passageText: data.passageText,
    passageTitle: data.passageTitle,
    taskDescription: data.taskDescription,
    taskNumber: data.taskNumber,
    minWords: data.minWords,
    imageUrl: data.imageUrl,
    partNumber: data.partNumber,
    speakingPrompts: data.speakingPrompts,
    preparationTime: data.preparationTime,
    responseTime: data.responseTime,
  });
}

/**
 * Update an existing section.
 */
export async function updateSection(
  id: string,
  data: Partial<{
    sectionType: string;
    sectionOrder: number;
    title: string;
    instructions: string;
    durationMinutes: number;
    audioUrl: string;
    passageText: string;
    passageTitle: string;
    taskDescription: string;
    taskNumber: number;
    minWords: number;
    imageUrl: string;
    partNumber: number;
    speakingPrompts: any;
    preparationTime: number;
    responseTime: number;
  }>,
) {
  const existing = await sectionModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Section not found');
  }

  return sectionModel.update(id, data);
}

/**
 * Delete a section by its ID.
 */
export async function deleteSection(id: string) {
  const existing = await sectionModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Section not found');
  }

  const deleted = await sectionModel.remove(id);
  if (!deleted) {
    throw new NotFoundError('Section not found');
  }

  return { success: true };
}

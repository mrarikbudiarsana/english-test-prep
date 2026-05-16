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
 * For TOEFL ITP reading sections, only the first section gets the full duration.
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
    moduleStage?: number;
    modulePath?: string;
    taskType?: string;
    audioThinkingTime?: number;
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
  const allSections = await sectionModel.findByTestId(testId);

  let finalDuration = data.durationMinutes;

  // For TOEFL ITP: only the first section of each type (listening/structure/reading) gets duration
  if (test.testType === 'toefl_itp' && ['listening', 'structure', 'reading'].includes(data.sectionType)) {
    const hasSectionOfType = allSections.some((s) => s.sectionType === data.sectionType);

    // If a section of this type already exists, this is not the first one - set to 0
    if (hasSectionOfType) {
      finalDuration = 0;
    }
  }

  return sectionModel.create({
    testId,
    sectionOrder,
    sectionType: data.sectionType,
    title: data.title,
    instructions: data.instructions,
    durationMinutes: finalDuration,
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
    moduleStage: data.moduleStage,
    modulePath: data.modulePath,
    taskType: data.taskType,
    audioThinkingTime: data.audioThinkingTime,
  });
}

/**
 * Update an existing section.
 * For TOEFL ITP reading sections, automatically manages duration:
 * - First reading section gets the specified duration
 * - All other reading sections get 0 duration
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
    moduleStage: number;
    modulePath: string;
    taskType: string;
    audioThinkingTime: number;
  }>,
) {
  const existing = await sectionModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Section not found');
  }

  const updateData = { ...data };
  const test = await testModel.findById(existing.testId);
  if (!test) {
    throw new NotFoundError('Test not found');
  }

  // For TOEFL ITP: manage duration automatically for listening/structure/reading
  if (data.durationMinutes !== undefined) {
    if (test.testType === 'toefl_itp') {
      // Check the section type (use updated value if provided, otherwise use existing)
      const sectionType = data.sectionType || existing.sectionType;

      if (['listening', 'structure', 'reading'].includes(sectionType)) {
        // Get all sections of this type for this test
        const allSections = await sectionModel.findByTestId(existing.testId);
        const sectionsOfType = allSections.filter((s) => s.sectionType === sectionType);

        // Find which section of this type this is (in order)
        const sectionIndex = sectionsOfType.findIndex((s) => s.id === id);

        // Only the first section of each type (index 0) can have non-zero duration
        if (sectionIndex > 0) {
          updateData.durationMinutes = 0;
        }
      }
    }
  }

  return sectionModel.update(id, updateData);
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

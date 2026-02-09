import * as questionModel from '../models/question.model';
import * as sectionModel from '../models/section.model';
import { NotFoundError } from '../middleware/errorHandler';

/**
 * Get questions for a section WITHOUT correct_answer (for student view).
 * Strips out correctAnswer and explanation fields from results.
 */
export async function getQuestionsBySectionId(sectionId: string) {
  // Verify the section exists
  const section = await sectionModel.findById(sectionId);
  if (!section) {
    throw new NotFoundError('Section not found');
  }

  const questions = await questionModel.findBySectionId(sectionId);

  // Strip out correct_answer and explanation for student-facing view
  return questions.map((q: any) => ({
    id: q.id,
    sectionId: q.sectionId,
    questionNumber: q.questionNumber,
    questionType: q.questionType,
    questionText: q.questionText,
    questionData: q.questionData,
    points: q.points,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  }));
}

/**
 * Get questions for a section WITH correct_answer (for admin/scoring).
 * Returns the full question objects including correctAnswer and explanation.
 */
export async function getQuestionsBySectionIdWithAnswers(sectionId: string) {
  // Verify the section exists
  const section = await sectionModel.findById(sectionId);
  if (!section) {
    throw new NotFoundError('Section not found');
  }

  return questionModel.findBySectionId(sectionId);
}

/**
 * Get a single question by its ID. Throws NotFoundError if not found.
 */
export async function getQuestionById(id: string) {
  const question = await questionModel.findById(id);
  if (!question) {
    throw new NotFoundError('Question not found');
  }
  return question;
}

/**
 * Create a new question in a section.
 * Automatically assigns the next question_number value.
 */
export async function createQuestion(
  sectionId: string,
  data: {
    questionType: string;
    questionText: string;
    questionData: any;
    correctAnswer: any;
    points?: number;
    explanation?: string;
  },
) {
  // Verify the section exists
  const section = await sectionModel.findById(sectionId);
  if (!section) {
    throw new NotFoundError('Section not found');
  }

  // Auto-assign the next question_number
  const maxNumber = await questionModel.getMaxQuestionNumber(sectionId);
  const questionNumber = maxNumber + 1;

  return questionModel.create({
    sectionId,
    questionNumber,
    questionType: data.questionType,
    questionText: data.questionText,
    questionData: data.questionData,
    correctAnswer: data.correctAnswer,
    points: data.points,
    explanation: data.explanation,
  });
}

/**
 * Update an existing question.
 */
export async function updateQuestion(
  id: string,
  data: Partial<{
    questionNumber: number;
    questionType: string;
    questionText: string;
    questionData: any;
    correctAnswer: any;
    points: number;
    explanation: string;
  }>,
) {
  const existing = await questionModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Question not found');
  }

  return questionModel.update(id, data);
}

/**
 * Delete a question by its ID.
 */
export async function deleteQuestion(id: string) {
  const existing = await questionModel.findById(id);
  if (!existing) {
    throw new NotFoundError('Question not found');
  }

  const deleted = await questionModel.remove(id);
  if (!deleted) {
    throw new NotFoundError('Question not found');
  }

  return { success: true };
}

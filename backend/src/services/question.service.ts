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

  let questions = await questionModel.findBySectionId(sectionId);

  // Writing and speaking sections store their content on the section itself (no
  // question rows needed for content). However the responses table requires a
  // question_id FK, so we auto-create a single placeholder question the first
  // time the section is fetched during a test. This is idempotent – subsequent
  // fetches just return the existing row.
  if (questions.length === 0 && (section.sectionType === 'writing' || section.sectionType === 'speaking')) {
    const placeholder = await questionModel.create({
      sectionId,
      questionNumber: 1,
      questionType: section.sectionType === 'writing' ? 'writing_task' : 'speaking_response',
      questionText: '',
      questionData: {},
      correctAnswer: {},
      points: 0,
    });
    questions = [placeholder];
  }

  // Strip out correct_answer and explanation for student-facing view
  return questions.map((q: any) => ({
    id: q.id,
    sectionId: q.sectionId,
    questionNumber: q.questionNumber,
    questionType: q.questionType,
    questionText: q.questionText,
    audioUrl: q.audioUrl,
    questionData: q.questionData,
    points: q.points,
    groupLabel: q.groupLabel,
    groupInstructions: q.groupInstructions,
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
    questionNumber?: number;
    questionType: string;
    questionText: string;
    audioUrl?: string;
    questionData: any;
    correctAnswer: any;
    points?: number;
    explanation?: string;
    groupLabel?: string;
    groupInstructions?: string;
  },
) {
  // Verify the section exists
  const section = await sectionModel.findById(sectionId);
  if (!section) {
    throw new NotFoundError('Section not found');
  }

  // Preserve explicit question number from admin payload when provided,
  // otherwise auto-assign the next available number.
  const questionNumber =
    data.questionNumber && data.questionNumber > 0
      ? data.questionNumber
      : (await questionModel.getMaxQuestionNumber(sectionId)) + 1;

  return questionModel.create({
    sectionId,
    questionNumber,
    questionType: data.questionType,
    questionText: data.questionText,
    audioUrl: data.audioUrl,
    questionData: data.questionData,
    correctAnswer: data.correctAnswer,
    points: data.points,
    explanation: data.explanation,
    groupLabel: data.groupLabel,
    groupInstructions: data.groupInstructions,
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
    audioUrl: string;
    questionData: any;
    correctAnswer: any;
    points: number;
    explanation: string;
    groupLabel: string;
    groupInstructions: string;
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

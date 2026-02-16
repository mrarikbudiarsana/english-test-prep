import * as testService from './test.service';
import * as sectionService from './section.service';
import * as questionService from './question.service';
import * as userModel from '../models/user.model';
import * as testModel from '../models/test.model';
import * as attemptModel from '../models/attempt.model';
import * as sectionModel from '../models/section.model';
import * as questionModel from '../models/question.model';
import { getClient } from '../config/database';

/**
 * Admin: Create a new test.
 */
export async function createTest(
  createdBy: string,
  data: {
    title: string;
    description?: string;
    testType: string;
    isFree?: boolean;
  },
) {
  return testService.createTest(data, createdBy);
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
  return testService.updateTest(id, data);
}

/**
 * Admin: Delete a test.
 */
export async function deleteTest(id: string) {
  return testService.deleteTest(id);
}

/**
 * Admin: Get all tests (including unpublished) with pagination.
 */
export async function getAllTests(offset: number = 0, limit: number = 20) {
  return testModel.findAllAdmin(offset, limit);
}

/**
 * Admin: Get a single test by ID with all sections and questions.
 */
export async function getTestById(id: string) {
  return testService.getTestById(id);
}

/**
 * Admin: Toggle the published status of a test.
 */
export async function publishTest(id: string) {
  const test = await testModel.findById(id);
  const newPublishState = test ? !test.isPublished : true;
  return testService.publishTest(id, newPublishState);
}

/**
 * Admin: Create a new section for a test.
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
  return sectionService.createSection(testId, data);
}

/**
 * Admin: Update a section.
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
  return sectionService.updateSection(id, data);
}

/**
 * Admin: Delete a section.
 */
export async function deleteSection(id: string) {
  return sectionService.deleteSection(id);
}

/**
 * Admin: Get all questions for a section.
 */
export async function getQuestionsBySection(sectionId: string) {
  return questionService.getQuestionsBySectionIdWithAnswers(sectionId);
}

/**
 * Admin: Create a new question in a section.
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
  return questionService.createQuestion(sectionId, data);
}

/**
 * Admin: Update a question.
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
  return questionService.updateQuestion(id, data);
}

/**
 * Admin: Delete a question.
 */
export async function deleteQuestion(id: string) {
  return questionService.deleteQuestion(id);
}

/**
 * Admin: Bulk create questions for a TOEFL ITP section.
 */
export async function bulkCreateQuestions(
  sectionId: string,
  questions: Array<{
    questionText: string;
    options: { key: string; text: string }[];
    correctAnswer: string;
    explanation?: string;
    questionNumber?: number;
  }>
) {
  // 1. Verify section exists
  const section = await sectionModel.findById(sectionId);
  if (!section) {
    const error = new Error('Section not found') as any;
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify it's a TOEFL ITP test
  const test = await testModel.findById(section.testId);
  if (!test || test.testType !== 'toefl_itp') {
    const error = new Error('Bulk creation is only supported for TOEFL ITP tests') as any;
    error.statusCode = 400;
    throw error;
  }

  // 3. Validate all questions
  if (!questions || questions.length === 0) {
    const error = new Error('No questions provided') as any;
    error.statusCode = 400;
    throw error;
  }

  const validationErrors: Array<{ index: number; errors: string[] }> = [];
  questions.forEach((q, index) => {
    const errors: string[] = [];

    // Question text is optional for listening sections (questions can be audio-only)
    // but required for other section types - this validation happens in the admin editor
    // so we allow empty text here for flexibility

    if (!q.options || q.options.length !== 4) {
      errors.push('Exactly 4 options (A-D) are required');
    }
    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer?.toUpperCase())) {
      errors.push('Correct answer must be A, B, C, or D');
    }

    if (errors.length > 0) {
      validationErrors.push({ index: index + 1, errors });
    }
  });

  if (validationErrors.length > 0) {
    const error = new Error(
      `Validation failed for ${validationErrors.length} question(s): ` +
        validationErrors.map((e) => `Q${e.index}: ${e.errors.join(', ')}`).join('; ')
    ) as any;
    error.statusCode = 400;
    error.details = { errors: validationErrors };
    throw error;
  }

  // 4. Get starting question number
  const maxQuestionNumber = await questionModel.getMaxQuestionNumber(sectionId);
  let nextNumber = maxQuestionNumber + 1;

  // 5. Insert all questions in a transaction
  const client = await getClient();
  const createdQuestions: any[] = [];

  try {
    await client.query('BEGIN');

    for (const q of questions) {
      const questionData = {
        options: q.options,
        multiSelect: false,
      };

      // Use custom question number if provided, otherwise auto-assign
      const questionNumber = q.questionNumber && q.questionNumber > 0 ? q.questionNumber : nextNumber;
      if (!q.questionNumber || q.questionNumber <= 0) {
        nextNumber++;
      }

      const result = await client.query(
        `INSERT INTO questions (
          section_id, question_number, question_type,
          question_text, question_data, correct_answer,
          points, explanation
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          section_id AS "sectionId",
          question_number AS "questionNumber",
          question_type AS "questionType",
          question_text AS "questionText",
          question_data AS "questionData",
          correct_answer AS "correctAnswer",
          points,
          explanation`,
        [
          sectionId,
          questionNumber,
          'multiple_choice',
          q.questionText?.trim() || '',
          JSON.stringify(questionData),
          JSON.stringify(q.correctAnswer.toUpperCase()),
          1,
          q.explanation?.trim() || null,
        ]
      );

      createdQuestions.push(result.rows[0]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return {
    success: true,
    created: createdQuestions.length,
    questions: createdQuestions,
  };
}

/**
 * Admin: Bulk create questions for an IELTS section.
 * Supports multiple question types: multiple_choice, true_false_not_given,
 * yes_no_not_given, completion, matching, dropdown.
 */
export async function bulkCreateIELTSQuestions(
  sectionId: string,
  questions: Array<{
    questionType: string;
    questionText: string;
    questionData: any;
    correctAnswer: any;
    explanation?: string;
    questionNumber?: number;
    groupLabel?: string;
    groupInstructions?: string;
  }>
) {
  // 1. Verify section exists
  const section = await sectionModel.findById(sectionId);
  if (!section) {
    const error = new Error('Section not found') as any;
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify it's an IELTS test (academic or general_training)
  const test = await testModel.findById(section.testId);
  if (!test || (test.testType !== 'academic' && test.testType !== 'general_training')) {
    const error = new Error('IELTS bulk creation is only supported for IELTS tests (academic/general_training)') as any;
    error.statusCode = 400;
    throw error;
  }

  // 3. Validate all questions
  if (!questions || questions.length === 0) {
    const error = new Error('No questions provided') as any;
    error.statusCode = 400;
    throw error;
  }

  const validQuestionTypes = [
    'multiple_choice',
    'true_false_not_given',
    'yes_no_not_given',
    'completion',
    'matching',
    'dropdown',
  ];

  const validationErrors: Array<{ index: number; errors: string[] }> = [];
  questions.forEach((q, index) => {
    const errors: string[] = [];

    if (!validQuestionTypes.includes(q.questionType)) {
      errors.push(`Invalid question type: ${q.questionType}`);
    }

    // Type-specific validation
    switch (q.questionType) {
      case 'multiple_choice':
        if (!q.questionData?.options || q.questionData.options.length < 2) {
          errors.push('Multiple choice requires at least 2 options');
        }
        if (!q.correctAnswer) {
          errors.push('Multiple choice requires a correct answer');
        }
        break;
      case 'true_false_not_given':
        if (!['TRUE', 'FALSE', 'NOT GIVEN'].includes(q.correctAnswer?.toUpperCase?.())) {
          errors.push('TFNG answer must be TRUE, FALSE, or NOT GIVEN');
        }
        break;
      case 'yes_no_not_given':
        if (!['YES', 'NO', 'NOT GIVEN'].includes(q.correctAnswer?.toUpperCase?.())) {
          errors.push('YNNG answer must be YES, NO, or NOT GIVEN');
        }
        break;
      case 'completion':
        if (!q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)) {
          errors.push('Completion requires at least one correct answer');
        }
        break;
      case 'matching':
        if (!q.correctAnswer || typeof q.correctAnswer !== 'object') {
          errors.push('Matching requires an answer mapping object');
        }
        break;
      case 'dropdown':
        if (!q.correctAnswer || typeof q.correctAnswer !== 'object') {
          errors.push('Dropdown requires an answer mapping object');
        }
        if (!q.questionData?.context && !q.questionData?.dropdowns) {
          errors.push('Dropdown requires context with placeholders and dropdown options');
        }
        break;
    }

    if (errors.length > 0) {
      validationErrors.push({ index: index + 1, errors });
    }
  });

  if (validationErrors.length > 0) {
    const error = new Error(
      `Validation failed for ${validationErrors.length} question(s): ` +
        validationErrors.map((e) => `Q${e.index}: ${e.errors.join(', ')}`).join('; ')
    ) as any;
    error.statusCode = 400;
    error.details = { errors: validationErrors };
    throw error;
  }

  // 4. Get starting question number
  const maxQuestionNumber = await questionModel.getMaxQuestionNumber(sectionId);
  let nextNumber = maxQuestionNumber + 1;

  // 5. Insert all questions in a transaction
  const client = await getClient();
  const createdQuestions: any[] = [];

  try {
    await client.query('BEGIN');

    for (const q of questions) {
      // Use custom question number if provided, otherwise auto-assign
      const questionNumber = q.questionNumber && q.questionNumber > 0 ? q.questionNumber : nextNumber;
      if (!q.questionNumber || q.questionNumber <= 0) {
        nextNumber++;
      }

      // Normalize correct answer based on type
      let normalizedAnswer = q.correctAnswer;
      if (q.questionType === 'true_false_not_given' || q.questionType === 'yes_no_not_given') {
        normalizedAnswer = q.correctAnswer?.toUpperCase?.() || q.correctAnswer;
      } else if (q.questionType === 'multiple_choice' && typeof q.correctAnswer === 'string') {
        normalizedAnswer = q.correctAnswer.toUpperCase();
      }

      const result = await client.query(
        `INSERT INTO questions (
          section_id, question_number, question_type,
          question_text, question_data, correct_answer,
          points, explanation, group_label, group_instructions
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          section_id AS "sectionId",
          question_number AS "questionNumber",
          question_type AS "questionType",
          question_text AS "questionText",
          question_data AS "questionData",
          correct_answer AS "correctAnswer",
          points,
          explanation,
          group_label AS "groupLabel",
          group_instructions AS "groupInstructions"`,
        [
          sectionId,
          questionNumber,
          q.questionType,
          q.questionText?.trim() || '',
          JSON.stringify(q.questionData || {}),
          JSON.stringify(normalizedAnswer),
          1,
          q.explanation?.trim() || null,
          q.groupLabel?.trim() || null,
          q.groupInstructions?.trim() || null,
        ]
      );

      createdQuestions.push(result.rows[0]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return {
    success: true,
    created: createdQuestions.length,
    questions: createdQuestions,
  };
}

/**
 * Admin: Get all users with pagination.
 */
export async function getUsers(offset: number = 0, limit: number = 20) {
  return userModel.findAll(offset, limit);
}

/**
 * Admin: Update a user's role.
 */
export async function updateUserRole(userId: string, role: string) {
  return userModel.update(userId, { role });
}

/**
 * Admin: Get dashboard statistics.
 */
export async function getDashboardStats() {
  const usersResult = await userModel.findAll(0, 1);
  const testsResult = await testModel.findAllAdmin(0, 1);

  return {
    totalUsers: usersResult.total,
    totalTests: testsResult.total,
  };
}

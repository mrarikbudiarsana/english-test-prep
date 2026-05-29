import * as testService from './test.service';
import * as sectionService from './section.service';
import * as questionService from './question.service';
import * as userModel from '../models/user.model';
import * as testModel from '../models/test.model';
import * as aiService from './ai.service';
import * as attemptModel from '../models/attempt.model';
import * as sectionModel from '../models/section.model';
import * as questionModel from '../models/question.model';
import * as subscriptionService from './subscription.service';
import { getClient, query } from '../config/database';
import { clearSectionCache } from '../utils/cache';

/**
 * Admin: Get user by ID.
 */
export async function getUserById(userId: string) {
  const user = await userModel.findById(userId);
  if (!user) return null;

  const subscription = await subscriptionService.getActiveSub(userId);
  return { ...user, subscription };
}

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
    durationMinutes?: number;
    audioThinkingTime?: number;
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
    audioThinkingTime: number;
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
    moduleStage?: number;
    modulePath?: string;
    taskType?: string;
    audioThinkingTime?: number;
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
    moduleStage: number;
    modulePath: string;
    taskType: string;
    audioThinkingTime: number;
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
    itemPayload?: any;
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
    itemPayload: any;
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
    clearSectionCache(sectionId);
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
export async function getUsers(offset: number = 0, limit: number = 20, search?: string) {
  return userModel.findAll(offset, limit, search);
}

/**
 * Admin: Get all completed test results with pagination, sorted latest first.
 */
export async function getAllResults(offset: number = 0, limit: number = 50, search?: string) {
  return attemptModel.findAllCompleted(offset, limit, search);
}

/**
 * Admin: Get all completed test results for export.
 */
export async function exportResults(search?: string) {
  return attemptModel.findAllCompleted(0, 10000, search);
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
  const completedAttemptsResult = await attemptModel.findAllCompleted(0, 1);

  // Geographic statistics
  const countriesQuery = await query(
    `SELECT COALESCE(country, 'Unknown') AS country, COUNT(*)::int AS count
     FROM users
     GROUP BY country
     ORDER BY count DESC`
  );
  const citiesQuery = await query(
    `SELECT COALESCE(city, 'Unknown') AS city, COUNT(*)::int AS count
     FROM users
     GROUP BY city
     ORDER BY count DESC`
  );

  // Difficult questions (lowest success rate)
  const difficultQuestionsQuery = await query(
    `SELECT 
       q.id, 
       q.question_number AS "questionNumber", 
       s.title AS "sectionTitle", 
       t.title AS "testTitle",
       COUNT(r.id)::int AS "totalResponses",
       SUM(CASE WHEN r.is_correct = TRUE THEN 1 ELSE 0 END)::int AS "correctResponses"
     FROM responses r
     JOIN questions q ON r.question_id = q.id
     JOIN sections s ON q.section_id = s.id
     JOIN tests t ON s.test_id = t.id
     JOIN attempts a ON r.attempt_id = a.id
     WHERE NOT a.is_preview
     GROUP BY q.id, s.id, t.id
     HAVING COUNT(r.id) > 0
     ORDER BY (SUM(CASE WHEN r.is_correct = TRUE THEN 1 ELSE 0 END)::float / COUNT(r.id)) ASC
     LIMIT 5`
  );

  // Top performers
  const topPerformersQuery = await query(
    `SELECT 
       u.id, 
       u.display_name AS "displayName", 
       u.email, 
       AVG(a.overall_score)::float AS "avgScore",
       COUNT(a.id)::int AS "totalAttempts"
     FROM attempts a
     JOIN users u ON a.user_id = u.id
     WHERE a.status = 'completed' AND NOT a.is_preview AND a.overall_score IS NOT NULL
     GROUP BY u.id
     ORDER BY "avgScore" DESC
     LIMIT 5`
  );

  return {
    totalUsers: usersResult.total,
    totalTests: testsResult.total,
    totalAttempts: completedAttemptsResult.total,
    locationStats: {
      countries: countriesQuery.rows,
      cities: citiesQuery.rows,
    },
    difficultQuestions: difficultQuestionsQuery.rows,
    topPerformers: topPerformersQuery.rows,
  };
}

/**
 * Admin: Manually assign a package to a user.
 */
export async function assignPackage(userId: string, planType: string, examType?: string) {
  return subscriptionService.assignManualSubscription(userId, planType, examType);
}

/**
 * Admin: Duplicate a test with all its sections and questions.
 */
export async function duplicateTest(testId: string, createdBy: string) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Get original test
    const test = await testModel.findById(testId);
    if (!test) throw new Error('Test not found');

    // 2. Create new test
    const newTest = await testService.createTest({
      title: `${test.title} (Copy)`,
      description: test.description || undefined,
      testType: test.testType,
      isFree: test.isFree,
      durationMinutes: test.durationMinutes,
    }, createdBy);

    // 3. Get all sections
    const sections = await sectionModel.findByTestId(testId);

    for (const section of sections) {
      // 4. Create new section
      const newSection = await sectionModel.create({
        testId: newTest.id,
        sectionType: section.sectionType,
        sectionOrder: section.sectionOrder,
        title: section.title || undefined,
        instructions: section.instructions || undefined,
        durationMinutes: section.durationMinutes,
        audioUrl: section.audioUrl || undefined,
        passageText: section.passageText || undefined,
        passageTitle: section.passageTitle || undefined,
        taskDescription: section.taskDescription || undefined,
        taskNumber: section.taskNumber || undefined,
        minWords: section.minWords || undefined,
        imageUrl: section.imageUrl || undefined,
        partNumber: section.partNumber || undefined,
        speakingPrompts: section.speakingPrompts,
        preparationTime: section.preparationTime || undefined,
        responseTime: section.responseTime || undefined,
        moduleStage: section.moduleStage || undefined,
        modulePath: section.modulePath || undefined,
        taskType: section.taskType || undefined,
        audioThinkingTime: section.audioThinkingTime || undefined,
      });

      // 5. Get all questions for this section
      const questions = await query(
        'SELECT * FROM questions WHERE section_id = $1 ORDER BY question_number ASC',
        [section.id]
      );

      for (const q of questions.rows) {
        // 6. Create new question
        await query(
          `INSERT INTO questions (
            section_id, question_number, question_type, 
            question_text, question_data, correct_answer, 
            points, explanation, explanation_ai, 
            group_label, group_instructions, item_payload,
            audio_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            newSection.id,
            q.question_number,
            q.question_type,
            q.question_text,
            q.question_data,
            q.correct_answer,
            q.points,
            q.explanation,
            q.explanation_ai,
            q.group_label,
            q.group_instructions,
            q.item_payload,
            q.audio_url
          ]
        );
      }
    }

    await client.query('COMMIT');
    return newTest;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
export async function generateAIReadingQuestions(sectionId: string) {
  const aiQuestions = await aiService.generateReadingQuestions(sectionId);
  
  // Transform AI questions to our DB format
  const questionsToCreate = aiQuestions.map((q: any, index: number) => {
    // Map options ["Text A", "Text B", ...] to [{key: "A", text: "Text A"}, ...]
    const optionKeys = ['A', 'B', 'C', 'D'];
    const formattedOptions = q.options.map((opt: string, i: number) => ({
      key: optionKeys[i] || String.fromCharCode(65 + i),
      text: opt
    }));

    // Find the key for the correct answer
    // If Gemini returns "Option A" and our option is "Option A", the key is "A"
    const correctOptionIndex = q.options.findIndex((opt: string) => opt === q.correctAnswer);
    const correctKey = correctOptionIndex !== -1 ? optionKeys[correctOptionIndex] : 'A';

    return {
      questionNumber: index + 1,
      questionText: q.questionText,
      options: formattedOptions,
      correctAnswer: correctKey,
      explanation: q.explanation,
    };
  });

  return bulkCreateQuestions(sectionId, questionsToCreate);
}

/**
 * Admin: Get all pricing waitlist signups with plan details and user details.
 */
export async function getWaitlist() {
  const result = await query(
    `SELECT 
       pw.id, 
       pw.email, 
       pw.plan_id AS "planId", 
       pp.name AS "planName", 
       pw.created_at AS "createdAt",
       u.display_name AS "displayName",
       u.id AS "userId"
     FROM pricing_waitlist pw
     LEFT JOIN pricing_plans pp ON pw.plan_id = pp.id
     LEFT JOIN users u ON pw.user_id = u.id
     ORDER BY pw.created_at DESC`
  );
  return result.rows;
}

/**
 * Admin: Remove/delete a waitlist entry.
 */
export async function deleteWaitlist(id: number) {
  await query(
    'DELETE FROM pricing_waitlist WHERE id = $1',
    [id]
  );
  return { success: true };
}

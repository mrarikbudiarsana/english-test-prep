import * as testService from './test.service';
import * as sectionService from './section.service';
import * as questionService from './question.service';
import * as userModel from '../models/user.model';
import * as testModel from '../models/test.model';
import * as attemptModel from '../models/attempt.model';

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
 * Admin: Create a new question in a section.
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
    questionData: any;
    correctAnswer: any;
    points: number;
    explanation: string;
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

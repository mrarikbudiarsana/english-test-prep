import { Request, Response, NextFunction } from 'express';
import * as testService from '../services/test.service';
import * as questionService from '../services/question.service';
import * as attemptService from '../services/attempt.service';

export async function getTests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    // Support comma-separated test types (e.g., ?testTypes=academic,general_training)
    const testTypesParam = req.query.testTypes as string | undefined;
    const testTypes = testTypesParam ? testTypesParam.split(',') : undefined;
    const result = await testService.getPublishedTests(offset, limit, testTypes);
    res.json({ data: result, offset, limit });
  } catch (error) {
    next(error);
  }
}

export async function getTestById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const test = await testService.getTestById(testId);
    res.json({ data: test });
  } catch (error) {
    next(error);
  }
}

export async function getTestSections(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const result = await testService.getTestWithSections(testId);
    const sections = result.sections;
    res.json({ data: sections });
  } catch (error) {
    next(error);
  }
}

export async function getSectionQuestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = req.params.sectionId as string;
    const questions = await questionService.getQuestionsBySectionId(sectionId);
    res.json({ data: questions });
  } catch (error) {
    next(error);
  }
}

export async function checkTestAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const userId = req.user!.id;
    const result = await attemptService.checkTestAccess(userId, testId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

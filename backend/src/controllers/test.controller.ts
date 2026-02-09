import { Request, Response, NextFunction } from 'express';
import * as testService from '../services/test.service';
import * as questionService from '../services/question.service';

export async function getTests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await testService.getPublishedTests(offset, limit);
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

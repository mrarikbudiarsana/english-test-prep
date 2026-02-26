import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';

// ---------- Test CRUD ----------

export async function createTest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const test = await adminService.createTest(req.user!.id, req.body);
    res.status(201).json({ data: test });
  } catch (error) {
    next(error);
  }
}

export async function updateTest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const test = await adminService.updateTest(testId, req.body);
    res.json({ data: test });
  } catch (error) {
    next(error);
  }
}

export async function deleteTest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    await adminService.deleteTest(testId);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getAllTests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await adminService.getAllTests(offset, limit);
    res.json({ data: result.rows, total: result.total, offset, limit });
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
    const test = await adminService.getTestById(testId);
    res.json({ data: test });
  } catch (error) {
    next(error);
  }
}

export async function publishTest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const test = await adminService.publishTest(testId);
    res.json({ data: test });
  } catch (error) {
    next(error);
  }
}

export async function setToeflIbtBlueprint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const blueprint = req.body?.blueprint ?? req.body;
    const test = await adminService.setToeflIbtBlueprint(testId, blueprint);
    res.json({ data: test });
  } catch (error) {
    next(error);
  }
}

export async function validateToeflIbtBlueprint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const result = await adminService.validateToeflIbtBlueprint(testId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function validatePteBlueprint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const result = await adminService.validatePteBlueprint(testId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function validatePtePublish(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const result = await adminService.validatePtePublish(testId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

// ---------- Section CRUD ----------

export async function createSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const section = await adminService.createSection(testId, req.body);
    res.status(201).json({ data: section });
  } catch (error) {
    next(error);
  }
}

export async function updateSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = req.params.sectionId as string;
    const section = await adminService.updateSection(sectionId, req.body);
    res.json({ data: section });
  } catch (error) {
    next(error);
  }
}

export async function deleteSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = req.params.sectionId as string;
    await adminService.deleteSection(sectionId);
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// ---------- Question CRUD ----------

export async function getQuestionsBySection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = req.params.sectionId as string;
    const questions = await adminService.getQuestionsBySection(sectionId);
    res.json({ data: questions });
  } catch (error) {
    next(error);
  }
}

export async function createQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = req.params.sectionId as string;
    const question = await adminService.createQuestion(sectionId, req.body);
    res.status(201).json({ data: question });
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const questionId = req.params.questionId as string;
    const question = await adminService.updateQuestion(questionId, req.body);
    res.json({ data: question });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const questionId = req.params.questionId as string;
    await adminService.deleteQuestion(questionId);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateQuestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = req.params.sectionId as string;
    const { questions } = req.body;
    const result = await adminService.bulkCreateQuestions(sectionId, questions);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateIELTSQuestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = req.params.sectionId as string;
    const { questions } = req.body;
    const result = await adminService.bulkCreateIELTSQuestions(sectionId, questions);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateToeflIbtQuestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = req.params.sectionId as string;
    const { questions } = req.body;
    const result = await adminService.bulkCreateToeflIbtQuestions(sectionId, questions);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

// ---------- Users ----------

export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await adminService.getUsers(offset, limit);
    res.json({ data: result.rows, total: result.total, offset, limit });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const user = await adminService.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const { role } = req.body;
    const user = await adminService.updateUserRole(userId, role);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function getUserAttempts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;

    // We import attemptService directly here since adminService doesn't wrap this yet
    // and we want to reuse the existing logic.
    // Ideally this should go through adminService but for now this is efficient.
    const attemptService = require('../services/attempt.service');
    const result = await attemptService.getUserAttempts(userId, offset, limit);

    res.json({ data: result.rows, total: result.total, offset, limit });
  } catch (error) {
    next(error);
  }
}

// ---------- Stats ----------

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
}

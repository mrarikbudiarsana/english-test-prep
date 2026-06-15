import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import * as attemptService from '../services/attempt.service';
import * as settingsService from '../services/settings.service';

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
  const testId = req.params.testId as string;

  try {
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

// ---------- Users ----------

export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const result = await adminService.getUsers(offset, limit, search);
    res.json({ data: result.rows, total: result.total, offset, limit, search });
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

// ---------- Results ----------

export async function getAllResults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const result = await adminService.getAllResults(offset, limit, search);
    res.json({ data: result.rows, total: result.total, offset, limit, search });
  } catch (error) {
    next(error);
  }
}

export async function exportResults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const search = req.query.search as string;
    const result = await adminService.exportResults(search);
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function assignPackage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const { billingCycle, pricingPlanId, examType } = req.body;
    const subscription = await adminService.assignPackage(userId, billingCycle, pricingPlanId, examType);
    res.json({ data: subscription });
  } catch (error) {
    next(error);
  }
}

// ---------- Settings ----------

export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Adding console log to debug on Vercel
    console.log('Admin settings requested by:', req.user?.email);
    
    const maintenanceMode = await settingsService.isMaintenanceMode();
    const announcement = await settingsService.getAnnouncement();
    
    res.json({
      data: {
        maintenanceMode: !!maintenanceMode,
        announcementMessage: announcement.message,
        announcementActive: announcement.active
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { maintenanceMode, announcementMessage, announcementActive } = req.body;
    
    if (maintenanceMode !== undefined) {
      await settingsService.setSetting('maintenance_mode', maintenanceMode);
    }
    if (announcementMessage !== undefined) {
      await settingsService.setSetting('announcement_message', announcementMessage);
    }
    if (announcementActive !== undefined) {
      await settingsService.setSetting('announcement_active', announcementActive);
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error in updateSettings controller:', error);
    next(error);
  }
}

export async function duplicateTest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const testId = req.params.testId as string;
    const test = await adminService.duplicateTest(testId, req.user!.id);
    res.status(201).json({ data: test });
  } catch (error) {
    next(error);
  }
}
export async function generateAIReadingQuestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sectionId = req.params.sectionId as string;
    const questions = await adminService.generateAIReadingQuestions(sectionId);
    res.status(201).json({ data: questions });
  } catch (error) {
    next(error);
  }
}

export async function formatWrittenExpression(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }
    // We import aiService directly here, or we could go through adminService. Going through aiService directly is fine.
    const { formatWrittenExpression } = await import('../services/ai.service');
    const formatted = await formatWrittenExpression(text);
    res.json({ data: formatted });
  } catch (error) {
    next(error);
  }
}

// ---------- Waitlist ----------

export async function getWaitlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await adminService.getWaitlist();
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteWaitlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid waitlist ID' });
      return;
    }
    await adminService.deleteWaitlist(id);
    res.json({ message: 'Waitlist entry deleted successfully' });
  } catch (error) {
    next(error);
  }
}

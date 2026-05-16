import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import * as settingsService from '../services/settings.service';

export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const examType = req.query.examType as string | undefined;
    const mode = req.query.mode as string | undefined;
    const stats = await dashboardService.getStats(req.user!.id, examType, mode);
    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const mode = req.query.mode as string | undefined;
    const result = await dashboardService.getHistory(req.user!.id, offset, limit, mode);
    res.json({ data: result.rows, total: result.total, offset, limit });
  } catch (error) {
    next(error);
  }
}

export async function getProgress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const progress = await dashboardService.getProgress(req.user!.id);
    res.json({ data: progress });
  } catch (error) {
    next(error);
  }
}

export async function getAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const announcement = await settingsService.getAnnouncement();
    res.json({ data: announcement });
  } catch (error) {
    next(error);
  }
}

import { Request, Response, NextFunction } from 'express';
import * as attemptService from '../services/attempt.service';
import * as responseModel from '../models/response.model';

export async function startAttempt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { testId, mode, practiceSectionType } = req.body;
    const attempt = await attemptService.startAttempt(req.user!.id, testId, mode, practiceSectionType);
    res.status(201).json({ data: attempt });
  } catch (error) {
    next(error);
  }
}

export async function getAttempt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const attemptId = req.params.attemptId as string;
    const attempt = await attemptService.getAttempt(attemptId, req.user!.id);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ data: attempt });
  } catch (error) {
    next(error);
  }
}

export async function getResponses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const attemptId = req.params.attemptId as string;
    // Verify attempt access and ownership first
    await attemptService.getAttempt(attemptId, req.user!.id);
    const responses = await responseModel.findByAttemptId(attemptId);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ data: responses });
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
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const mode = req.query.mode as string | undefined;
    const result = await attemptService.getUserAttempts(req.user!.id, offset, limit, mode);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ data: result.rows, total: result.total, offset, limit });
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
    const attemptId = req.params.attemptId as string;
    const { sectionType } = req.body;
    // Verify ownership before allowing section change
    await attemptService.getAttempt(attemptId, req.user!.id);
    const attempt = await attemptService.updateCurrentSection(attemptId, sectionType);
    res.json({ data: attempt });
  } catch (error) {
    next(error);
  }
}

export async function saveResponses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const attemptId = req.params.attemptId as string;
    const { responses } = req.body;

    // Verify ownership
    await attemptService.getAttempt(attemptId, req.user!.id);

    // Validate array
    if (!Array.isArray(responses) || responses.length === 0) {
      res.status(400).json({ error: 'responses must be a non-empty array' });
      return;
    }
    if (responses.length > 200) {
      res.status(400).json({ error: 'Too many responses in a single request (max 200)' });
      return;
    }

    // Allowlist only safe fields
    const enriched = responses.map((r: any) => ({
      attemptId,
      questionId: r.questionId,
      sectionId: r.sectionId,
      answerData: r.answerData,
    }));
    const saved = await responseModel.batchUpsert(enriched);
    res.json({ data: saved });
  } catch (error) {
    next(error);
  }
}

// autoSave uses the same logic as saveResponses
export const autoSave = saveResponses;

export async function submitSection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const attemptId = req.params.attemptId as string;
    const { sectionType } = req.body;
    // Verify ownership before allowing section submission
    await attemptService.getAttempt(attemptId, req.user!.id);
    const result = await attemptService.submitSection(attemptId, sectionType);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function submitTest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const attemptId = req.params.attemptId as string;
    // Verify ownership before allowing test submission
    await attemptService.getAttempt(attemptId, req.user!.id);
    const result = await attemptService.finalizeAttempt(attemptId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getResults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const attemptId = req.params.attemptId as string;
    // Admins can view any attempt; skip ownership check by omitting userId
    const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
    const results = await attemptService.getAttempt(attemptId, userId);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ data: results });
  } catch (error) {
    next(error);
  }
}

/**
 * Public endpoint for sharing - returns only basic info for OG image generation
 */
export async function getShareInfo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const attemptId = req.params.attemptId as string;
    const shareInfo = await attemptService.getShareInfo(attemptId);
    // Cache for 1 hour since this data doesn't change
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(shareInfo);
  } catch (error) {
    next(error);
  }
}

export async function deleteAttempt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const attemptId = req.params.attemptId as string;
    await attemptService.deleteAttempt(attemptId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

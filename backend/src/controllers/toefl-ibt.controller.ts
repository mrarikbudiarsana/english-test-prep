import { Request, Response, NextFunction } from 'express';
import * as routingService from '../services/toefl-ibt-routing.service';
import * as attemptModel from '../models/attempt.model';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

/**
 * POST /api/v1/attempts/:attemptId/toefl-ibt/route/:sectionType
 * After Stage 1 is submitted, determine upper/lower path and return Stage 2 section id.
 */
export async function routeSection(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = String(req.params.attemptId);
    const sectionType = String(req.params.sectionType);

    if (sectionType !== 'reading' && sectionType !== 'listening') {
      throw new ValidationError('sectionType must be "reading" or "listening"');
    }

    const attempt = await attemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');

    const result = await routingService.routeSection(
      attemptId,
      sectionType as 'reading' | 'listening',
      String(attempt.testId),
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/attempts/:attemptId/toefl-ibt/score/:sectionType
 * After Stage 2 is submitted, compute aggregate raw + band for this section type.
 * Stores the band back on the attempt and returns it.
 */
export async function scoreSection(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = String(req.params.attemptId);
    const sectionType = String(req.params.sectionType);

    if (sectionType !== 'reading' && sectionType !== 'listening') {
      throw new ValidationError('sectionType must be "reading" or "listening"');
    }

    const attempt = await attemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');

    const { raw, band } = await routingService.scoreSectionComplete(
      attemptId,
      sectionType as 'reading' | 'listening',
      String(attempt.testId),
    );

    // Persist scores onto the attempt
    if (sectionType === 'reading') {
      await attemptModel.updateScores(attemptId, { readingRaw: raw, readingBand: band });
    } else {
      await attemptModel.updateScores(attemptId, { listeningRaw: raw, listeningBand: band });
    }

    res.json({ raw, band });
  } catch (err) {
    next(err);
  }
}

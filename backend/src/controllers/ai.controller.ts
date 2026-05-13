import { Request, Response } from 'express';
import * as aiService from '../services/ai.service';
import { logger } from '../utils/logger';

export async function generateExplanation(req: Request, res: Response) {
  const { questionId } = req.params;

  try {
    const explanation = await aiService.generateQuestionExplanation(questionId as string);
    res.json({ success: true, explanation });
  } catch (error: any) {
    logger.error('Controller error generating AI explanation', { error: error.message, questionId });
    res.status(500).json({ error: error.message });
  }
}

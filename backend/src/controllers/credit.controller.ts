import { Request, Response, NextFunction } from 'express';
import * as lynkService from '../services/lynk.service';

export async function checkBalance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawEmail = (req.query.email as string) || req.body?.email || req.user?.email;
    if (!rawEmail) {
      res.status(400).json({ error: 'Email parameter is required' });
      return;
    }

    const result = await lynkService.checkCreditBalance(rawEmail);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

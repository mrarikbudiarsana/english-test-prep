import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscription.service';

export async function getPlans(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const plans = await subscriptionService.getPlans();
    res.json({ data: plans });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subscription = await subscriptionService.getActiveSub(req.user!.id);
    res.json({ data: subscription });
  } catch (error) {
    next(error);
  }
}

export async function getSubscriptionHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const history = await subscriptionService.getAllSubs(req.user!.id);
    res.json({ data: history });
  } catch (error) {
    next(error);
  }
}

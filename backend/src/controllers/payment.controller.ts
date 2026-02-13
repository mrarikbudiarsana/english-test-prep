import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';

export async function checkAvailability(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({ available: paymentService.isPaymentAvailable() });
  } catch (error) {
    next(error);
  }
}

export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { planType, examType } = req.body;
    const payment = await paymentService.createPayment(req.user!.id, planType, examType);
    res.status(201).json({ data: payment });
  } catch (error) {
    next(error);
  }
}

export async function handleNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const notification = req.body;
    await paymentService.handleNotification(notification);
    res.json({ message: 'Notification processed' });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orderId = req.params.orderId as string;
    const status = await paymentService.getPaymentStatus(orderId, req.user!.id);
    res.json({ data: status });
  } catch (error) {
    next(error);
  }
}

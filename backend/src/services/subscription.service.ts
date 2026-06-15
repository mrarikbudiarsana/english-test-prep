import * as subscriptionModel from '../models/subscription.model';
import * as paymentModel from '../models/payment.model';
import * as pricingModel from '../models/pricing.model';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { PLAN_CONFIGS } from '../types/payment.types';

/**
 * Get the currently active subscription for a user, or null if none exists.
 */
export async function getActiveSub(userId: string) {
  return subscriptionModel.findActiveByUserId(userId);
}

/**
 * Get all subscriptions (active, expired, cancelled, pending) for a user.
 */
export async function getAllSubs(userId: string) {
  return subscriptionModel.findByUserId(userId);
}

/**
 * Return the available subscription plans configuration.
 */
export function getPlans() {
  return PLAN_CONFIGS;
}

/**
 * Activate a subscription after successful payment.
 * Finds the payment by orderId, creates the subscription record,
 * sets it to active, and links it back to the payment.
 */
export async function activateSubscription(orderId: string) {
  // Find the payment record
  const payment = await paymentModel.findByOrderId(orderId);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.status !== 'settlement') {
    throw new ValidationError('Payment has not been settled');
  }

  // If a subscription is already linked, return it
  if (payment.subscriptionId) {
    const existingSub = await subscriptionModel.findById(payment.subscriptionId);
    if (existingSub) {
      return existingSub;
    }
  }

  // Determine the plan type from the payment amount
  const planEntry = Object.values(PLAN_CONFIGS).find(
    (plan) => plan.price === Number(payment.amount),
  );

  if (!planEntry) {
    throw new ValidationError('Unable to determine plan type from payment amount');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + planEntry.durationDays * 24 * 60 * 60 * 1000);

  // Create the subscription record
  const subscription = await subscriptionModel.create({
    userId: payment.userId,
    planType: planEntry.type,
    examType: (payment as any).examType ?? 'toefl_itp',
    startsAt: now,
    expiresAt,
  });

  // Activate the subscription
  await subscriptionModel.activate(subscription.id);

  // Link the subscription to the payment
  await paymentModel.updateByOrderId(orderId, {
    subscriptionId: subscription.id,
  });

  // Return the activated subscription
  return subscriptionModel.findById(subscription.id);
}

/**
 * Manually assign a subscription to a user (Admin only).
 */
export async function assignManualSubscription(userId: string, billingCycle: string, pricingPlanId: number, examType: string = 'toefl_itp') {
  const plan = await pricingModel.findById(pricingPlanId);
  if (!plan) {
    throw new ValidationError(`Invalid pricing plan ID: ${pricingPlanId}`);
  }

  if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
    throw new ValidationError(`Invalid billing cycle: ${billingCycle}`);
  }

  const durationDays = billingCycle === 'monthly' ? 30 : 365;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Create and activate the subscription record immediately
  const subscription = await subscriptionModel.create({
    userId,
    planType: billingCycle,
    pricingPlanId,
    examType,
    startsAt: now,
    expiresAt,
  });

  await subscriptionModel.activate(subscription.id);

  return subscriptionModel.findById(subscription.id);
}

import { snap, coreApi, isMidtransConfigured } from '../config/midtrans';
import * as paymentModel from '../models/payment.model';
import * as userModel from '../models/user.model';
import * as subscriptionService from './subscription.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../middleware/errorHandler';
import { PLAN_CONFIGS, PlanType } from '../types/payment.types';

/**
 * Helper to ensure Midtrans is configured before using payment features.
 */
function ensureMidtransConfigured(): void {
  if (!isMidtransConfigured || !snap || !coreApi) {
    throw new ValidationError(
      'Payment system is not configured yet. Please contact the administrator.',
    );
  }
}

/**
 * Check whether the payment system is available.
 */
export function isPaymentAvailable(): boolean {
  return isMidtransConfigured;
}

/**
 * Create a new payment using Midtrans Snap.
 * Generates a Snap token for frontend checkout and saves the payment record.
 */
export async function createPayment(userId: string, planType: PlanType) {
  ensureMidtransConfigured();

  // Validate plan type
  const plan = PLAN_CONFIGS[planType];
  if (!plan) {
    throw new ValidationError(`Invalid plan type: ${planType}`);
  }

  // Get the user for transaction details
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Generate a unique order ID
  const orderId = `IELTS-${planType.toUpperCase()}-${userId.substring(0, 8)}-${Date.now()}`;

  // Create Midtrans Snap transaction parameters
  const transactionParams = {
    transaction_details: {
      order_id: orderId,
      gross_amount: plan.price,
    },
    item_details: [
      {
        id: planType,
        price: plan.price,
        quantity: 1,
        name: plan.label,
      },
    ],
    customer_details: {
      email: user.email,
      first_name: user.displayName || user.email.split('@')[0],
    },
    callbacks: {
      finish: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/payment/finish`,
    },
  };

  try {
    // Create Snap transaction
    const snapResponse = await snap.createTransaction(transactionParams);
    const snapToken = snapResponse.token;

    // Save the payment record in the database
    const payment = await paymentModel.create({
      userId,
      midtransOrderId: orderId,
      snapToken,
      amount: plan.price,
      currency: plan.currency,
    });

    return {
      payment,
      snapToken,
      redirectUrl: snapResponse.redirect_url,
    };
  } catch (error: any) {
    console.error('Error creating Midtrans transaction:', error);
    throw new ValidationError(
      `Failed to create payment: ${error.message || 'Unknown Midtrans error'}`,
    );
  }
}

/**
 * Handle a Midtrans payment notification (webhook).
 * Verifies the notification with Midtrans Core API, updates the payment status,
 * and activates the subscription if payment is settled.
 */
export async function handleNotification(notification: {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
  [key: string]: any;
}) {
  ensureMidtransConfigured();

  const { order_id: orderId } = notification;

  if (!orderId) {
    throw new ValidationError('Missing order_id in notification');
  }

  // Verify the transaction status with Midtrans Core API
  let statusResponse: any;
  try {
    statusResponse = await coreApi.transaction.status(orderId);
  } catch (error: any) {
    console.error('Error verifying transaction with Midtrans:', error);
    throw new ValidationError('Failed to verify transaction with Midtrans');
  }

  const transactionStatus = statusResponse.transaction_status;
  const fraudStatus = statusResponse.fraud_status;
  const transactionId = statusResponse.transaction_id;
  const paymentType = statusResponse.payment_type;

  // Find the existing payment record
  const existingPayment = await paymentModel.findByOrderId(orderId);
  if (!existingPayment) {
    throw new NotFoundError(`Payment not found for order: ${orderId}`);
  }

  // Determine the payment status based on Midtrans status
  let paymentStatus: string;

  if (transactionStatus === 'capture') {
    // For card transactions, check fraud status
    paymentStatus = fraudStatus === 'accept' ? 'capture' : 'deny';
  } else if (transactionStatus === 'settlement') {
    paymentStatus = 'settlement';
  } else if (transactionStatus === 'deny') {
    paymentStatus = 'deny';
  } else if (transactionStatus === 'cancel' || transactionStatus === 'expire') {
    paymentStatus = transactionStatus;
  } else if (transactionStatus === 'pending') {
    paymentStatus = 'pending';
  } else if (transactionStatus === 'refund') {
    paymentStatus = 'refund';
  } else {
    paymentStatus = transactionStatus;
  }

  // Update the payment record
  await paymentModel.updateByOrderId(orderId, {
    status: paymentStatus,
    midtransTransactionId: transactionId,
    paymentType,
    midtransResponse: statusResponse,
  });

  // If payment is settled (or captured and accepted), activate the subscription
  if (paymentStatus === 'settlement' || paymentStatus === 'capture') {
    try {
      await subscriptionService.activateSubscription(orderId);
    } catch (error) {
      console.error('Error activating subscription after payment:', error);
      // Don't throw here; the payment is already recorded.
      // Subscription activation can be retried.
    }
  }

  return {
    orderId,
    status: paymentStatus,
    transactionId,
  };
}

/**
 * Get the payment status for a specific order, ensuring it belongs to the user.
 */
export async function getPaymentStatus(orderId: string, userId: string) {
  const payment = await paymentModel.findByOrderId(orderId);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.userId !== userId) {
    throw new ForbiddenError('You do not have access to this payment');
  }

  return {
    orderId: payment.midtransOrderId,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    paymentType: payment.paymentType,
    createdAt: payment.createdAt,
  };
}

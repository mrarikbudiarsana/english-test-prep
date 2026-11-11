import crypto from 'crypto';
import { query, pool } from '../config/database';
import * as userModel from '../models/user.model';
import { sendMockTestCreditsActivated } from './email.service';
import { logger } from '../utils/logger';
import { invalidateUserCache } from '../middleware/auth';

export interface LynkCreditResolution {
  credits: number;
  packageName: string;
  amount: number;
}

/**
 * Determine credit amount and package name based on Lynk.id webhook payload.
 * Checks for product slug, product title, and price.
 */
export function determineCredits(payload: any): LynkCreditResolution {
  const rawAmount = payload.amount || payload.total || payload.grand_total || payload.price || payload.data?.amount || 0;
  const amount = Number(rawAmount) || 0;

  // Convert payload to string for fast keyword and slug scanning
  const payloadStr = JSON.stringify(payload).toLowerCase();

  // 1. Direct Slug matches (from prompt checkout URLs)
  // 5 Credits (Intensive Pack): https://lynk.id/englishwitharik/y9l4x3rpmyk5
  if (payloadStr.includes('y9l4x3rpmyk5')) {
    return { credits: 5, packageName: '5 Test Credits (Intensive Pack)', amount: amount || 149000 };
  }
  // 3 Credits (Value Pack - Popular): https://lynk.id/englishwitharik/j6jxzpdynron
  if (payloadStr.includes('j6jxzpdynron')) {
    return { credits: 3, packageName: '3 Test Credits (Value Pack - Popular)', amount: amount || 99000 };
  }
  // 1 Credit: https://lynk.id/englishwitharik/rx9lj8kjey71
  if (payloadStr.includes('rx9lj8kjey71')) {
    return { credits: 1, packageName: '1 Test Credit', amount: amount || 49000 };
  }

  // 2. Keyword & Title matches
  if (payloadStr.includes('5 test') || payloadStr.includes('5 credit') || payloadStr.includes('intensive')) {
    return { credits: 5, packageName: '5 Test Credits (Intensive Pack)', amount: amount || 149000 };
  }
  if (payloadStr.includes('3 test') || payloadStr.includes('3 credit') || payloadStr.includes('value pack')) {
    return { credits: 3, packageName: '3 Test Credits (Value Pack - Popular)', amount: amount || 99000 };
  }
  if (payloadStr.includes('vip') || payloadStr.includes('review session') || payloadStr.includes('coaching')) {
    return { credits: 1, packageName: 'VIP Option (1 Test + 60-min Review Session)', amount: amount || 175000 };
  }
  if (payloadStr.includes('1 test') || payloadStr.includes('1 credit')) {
    return { credits: 1, packageName: '1 Test Credit', amount: amount || 49000 };
  }

  // 3. Price-based matching (tolerates slight discounts/admin fees)
  if (amount >= 130000 && amount <= 165000) {
    return { credits: 5, packageName: '5 Test Credits (Intensive Pack)', amount };
  }
  if (amount >= 85000 && amount <= 115000) {
    return { credits: 3, packageName: '3 Test Credits (Value Pack - Popular)', amount };
  }
  if (amount >= 166000 && amount <= 200000) {
    return { credits: 1, packageName: 'VIP Option (1 Test + 60-min Review Session)', amount };
  }
  if (amount >= 35000 && amount <= 65000) {
    return { credits: 1, packageName: '1 Test Credit', amount };
  }

  // Default fallback
  return { credits: 1, packageName: '1 Test Credit', amount: amount || 49000 };
}

/**
 * Process a confirmed Lynk.id payment webhook:
 * 1. Validates payment status
 * 2. Deduplicates transaction
 * 3. Finds or creates student record by email
 * 4. Adds test credits to user balance
 * 5. Logs audit trail & sends confirmation email
 */
export async function processLynkWebhook(payload: any) {
  logger.info('Processing Lynk.id webhook payload', { payloadSummary: JSON.stringify(payload).substring(0, 300) });

  // 1. Status validation (only process paid/success transactions)
  const rawStatus = (
    payload.status ||
    payload.event ||
    payload.state ||
    payload.data?.status ||
    payload.data?.event ||
    'paid'
  ).toString().toLowerCase();

  const isFailedStatus = ['failed', 'cancelled', 'canceled', 'expired', 'denied'].some((s) =>
    rawStatus.includes(s)
  );
  if (isFailedStatus) {
    logger.info(`Lynk.id webhook received with non-successful status: ${rawStatus}`);
    return { success: false, message: `Ignored status: ${rawStatus}` };
  }

  // 2. Extract Customer Email
  const rawEmail =
    payload.customer_email ||
    payload.email ||
    payload.customer?.email ||
    payload.buyer_email ||
    payload.buyer?.email ||
    payload.data?.customer_email ||
    payload.data?.email ||
    payload.data?.customer?.email ||
    payload.user_email;

  if (!rawEmail || typeof rawEmail !== 'string') {
    throw new Error('Customer email is required in Lynk.id webhook payload');
  }

  const email = rawEmail.trim().toLowerCase();
  const displayName = (
    payload.customer_name ||
    payload.name ||
    payload.customer?.name ||
    payload.buyer_name ||
    payload.buyer?.name ||
    payload.data?.customer_name ||
    payload.data?.customer?.name ||
    email.split('@')[0]
  ).toString().trim();

  // 3. Extract or generate Transaction ID
  const transactionId = (
    payload.transaction_id ||
    payload.order_id ||
    payload.id ||
    payload.ref_id ||
    payload.reference_id ||
    payload.data?.transaction_id ||
    payload.data?.order_id ||
    payload.data?.id ||
    `lynk_${Date.now()}_${Math.random().toString(36).substring(7)}`
  ).toString();

  // 4. Determine credits from payload
  const { credits, packageName, amount } = determineCredits(payload);

  // 5. Database transaction for atomic credit addition and idempotency
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check idempotency (already processed?)
    const existingTx = await client.query(
      'SELECT id, credits_added, status FROM lynk_transactions WHERE transaction_id = $1',
      [transactionId]
    );

    if (existingTx.rows.length > 0) {
      await client.query('COMMIT');
      logger.info(`Lynk transaction ${transactionId} already processed. Skipping duplicate.`);
      return {
        success: true,
        message: 'Transaction already processed',
        transactionId,
        alreadyProcessed: true,
      };
    }

    // Find or create user
    const existingUser = await client.query(
      `SELECT id, firebase_uid, email, display_name, test_credits
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    let userId: string;
    let newCreditBalance: number;
    let firebaseUidToInvalidate: string | null = null;

    if (existingUser.rows.length > 0) {
      // User exists -> increment credits
      userId = existingUser.rows[0].id;
      firebaseUidToInvalidate = existingUser.rows[0].firebase_uid;
      const updateResult = await client.query(
        `UPDATE users
         SET test_credits = test_credits + $1,
             display_name = COALESCE(display_name, $2),
             updated_at = NOW()
         WHERE id = $3
         RETURNING test_credits`,
        [credits, displayName, userId]
      );
      newCreditBalance = updateResult.rows[0].test_credits;
    } else {
      // User does not exist -> create user record
      const tempFirebaseUid = `lynk_${crypto.randomUUID()}`;
      const insertResult = await client.query(
        `INSERT INTO users (
           firebase_uid,
           email,
           display_name,
           test_credits,
           preferred_exam_type,
           role,
           is_active
         )
         VALUES ($1, $2, $3, $4, 'toefl_itp', 'user', true)
         RETURNING id, test_credits`,
        [tempFirebaseUid, email, displayName, credits]
      );
      userId = insertResult.rows[0].id;
      newCreditBalance = insertResult.rows[0].test_credits;
    }

    // Record in lynk_transactions
    await client.query(
      `INSERT INTO lynk_transactions (
         user_id,
         email,
         transaction_id,
         amount,
         credits_added,
         status,
         payload
       )
       VALUES ($1, $2, $3, $4, $5, 'paid', $6)`,
      [userId, email, transactionId, amount, credits, JSON.stringify(payload)]
    );

    // Record in test_credit_logs for audit
    await client.query(
      `INSERT INTO test_credit_logs (
         user_id,
         email,
         change_amount,
         balance_after,
         reason,
         reference_id
       )
       VALUES ($1, $2, $3, $4, 'lynk_purchase', $5)`,
      [userId, email, credits, newCreditBalance, transactionId]
    );

    await client.query('COMMIT');

    // Invalidate auth cache so the new credit balance is fresh on next authenticated request
    if (firebaseUidToInvalidate) {
      invalidateUserCache(firebaseUidToInvalidate);
    }

    // Fire off confirmation email in background
    sendMockTestCreditsActivated({
      to: email,
      displayName,
      creditsAdded: credits,
      totalCredits: newCreditBalance,
      packageName,
    }).catch((err) => {
      logger.error('Failed to send Lynk credit confirmation email:', { error: err.message, email });
    });

    logger.info(`Successfully added ${credits} credits to ${email}. New balance: ${newCreditBalance}`);

    return {
      success: true,
      message: 'Test credits successfully activated',
      email,
      creditsAdded: credits,
      totalCredits: newCreditBalance,
      packageName,
      transactionId,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check credit balance by email.
 */
export async function checkCreditBalance(email: string) {
  if (!email || typeof email !== 'string') {
    return { email: '', credits: 0, hasCredits: false, userExists: false };
  }
  const cleanEmail = email.trim().toLowerCase();
  const user = await userModel.findByEmail(cleanEmail);

  if (!user) {
    return { email: cleanEmail, credits: 0, hasCredits: false, userExists: false };
  }

  const credits = user.testCredits ?? 0;
  return {
    email: cleanEmail,
    credits,
    hasCredits: credits > 0,
    userExists: true,
    displayName: user.displayName,
    userId: user.id,
  };
}

/**
 * Deduct 1 credit for a test attempt.
 * Accepts userId or email.
 */
export async function deductCreditForTest(userId: string, email?: string): Promise<{
  success: boolean;
  remainingCredits: number;
  userId: string;
}> {
  // If email is explicitly provided, verify it first
  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const deducted = await userModel.deductTestCreditByEmail(cleanEmail);
    if (deducted) {
      // Audit log
      await query(
        `INSERT INTO test_credit_logs (user_id, email, change_amount, balance_after, reason)
         VALUES ($1, $2, -1, $3, 'test_start')`,
        [deducted.id, cleanEmail, deducted.testCredits]
      );
      return { success: true, remainingCredits: deducted.testCredits, userId: deducted.id };
    }
  }

  // Fallback to userId
  const newCredits = await userModel.deductTestCredit(userId);
  if (newCredits !== null) {
    const user = await userModel.findById(userId);
    if (user) {
      await query(
        `INSERT INTO test_credit_logs (user_id, email, change_amount, balance_after, reason)
         VALUES ($1, $2, -1, $3, 'test_start')`,
        [userId, user.email, newCredits]
      );
      if (user.firebaseUid) invalidateUserCache(user.firebaseUid);
    }
    return { success: true, remainingCredits: newCredits, userId };
  }

  return { success: false, remainingCredits: 0, userId };
}

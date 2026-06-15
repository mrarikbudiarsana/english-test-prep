import { query } from '../config/database';

// ---------- helpers ----------

const SELECT_COLUMNS = `
  id,
  user_id      AS "userId",
  plan_type    AS "planType",
  exam_type    AS "examType",
  status,
  starts_at    AS "startsAt",
  expires_at   AS "expiresAt",
  auto_renew   AS "autoRenew",
  pricing_plan_id AS "pricingPlanId",
  created_at   AS "createdAt",
  updated_at   AS "updatedAt"
`;

// ---------- queries ----------

export async function findById(id: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS} FROM subscriptions WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function findActiveByUserId(userId: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM subscriptions
     WHERE user_id = $1
       AND status = 'active'
       AND expires_at > NOW()
     ORDER BY expires_at DESC
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] || null;
}

/**
 * Find an active subscription for a user that covers a specific exam type.
 */
export async function findActiveByUserIdAndExam(userId: string, examType: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM subscriptions
     WHERE user_id = $1
       AND exam_type = $2
       AND status = 'active'
       AND expires_at > NOW()
     ORDER BY expires_at DESC
     LIMIT 1`,
    [userId, examType],
  );
  return result.rows[0] || null;
}

export async function findByUserId(userId: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM subscriptions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function create(data: {
  userId: string;
  planType: string;
  examType?: string;
  pricingPlanId?: number;
  startsAt: string | Date;
  expiresAt: string | Date;
}) {
  const result = await query(
    `INSERT INTO subscriptions (user_id, plan_type, exam_type, status, starts_at, expires_at, pricing_plan_id)
     VALUES ($1, $2, $3, 'pending', $4, $5, $6)
     RETURNING ${SELECT_COLUMNS}`,
    [data.userId, data.planType, data.examType ?? 'toefl_itp', data.startsAt, data.expiresAt, data.pricingPlanId || null],
  );
  return result.rows[0];
}

export async function updateStatus(id: string, status: string) {
  const result = await query(
    `UPDATE subscriptions
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING ${SELECT_COLUMNS}`,
    [status, id],
  );
  return result.rows[0] || null;
}

export async function activate(id: string) {
  const result = await query(
    `UPDATE subscriptions
     SET status = 'active', updated_at = NOW()
     WHERE id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [id],
  );
  return result.rows[0] || null;
}

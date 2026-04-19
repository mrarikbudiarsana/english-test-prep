import { query } from '../config/database';

// ---------- helpers ----------

const SELECT_COLUMNS = `
  id,
  user_id                AS "userId",
  subscription_id        AS "subscriptionId",
  midtrans_order_id      AS "midtransOrderId",
  midtrans_transaction_id AS "midtransTransactionId",
  snap_token             AS "snapToken",
  amount,
  currency,
  exam_type              AS "examType",
  status,
  payment_type           AS "paymentType",
  midtrans_response      AS "midtransResponse",
  created_at             AS "createdAt",
  updated_at             AS "updatedAt"
`;

const updateFieldMap: Record<string, string> = {
  status: 'status',
  midtransTransactionId: 'midtrans_transaction_id',
  paymentType: 'payment_type',
  midtransResponse: 'midtrans_response',
  subscriptionId: 'subscription_id',
};

// ---------- queries ----------

export async function findById(id: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS} FROM payments WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function findByOrderId(orderId: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM payments
     WHERE midtrans_order_id = $1`,
    [orderId],
  );
  return result.rows[0] || null;
}

export async function findByUserId(userId: string, offset: number = 0, limit: number = 20) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM payments
     WHERE user_id = $1
     ORDER BY created_at DESC
     OFFSET $2 LIMIT $3`,
    [userId, offset, limit],
  );

  const countResult = await query(
    'SELECT COUNT(*) FROM payments WHERE user_id = $1',
    [userId],
  );

  return {
    rows: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function create(data: {
  userId: string;
  midtransOrderId: string;
  snapToken?: string;
  amount: number;
  currency?: string;
  examType?: string;
}) {
  const result = await query(
    `INSERT INTO payments (user_id, midtrans_order_id, snap_token, amount, currency, exam_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.userId,
      data.midtransOrderId,
      data.snapToken ?? null,
      data.amount,
      data.currency ?? 'IDR',
      data.examType ?? 'toefl_itp',
    ],
  );
  return result.rows[0];
}

export async function updateByOrderId(
  orderId: string,
  data: Partial<{
    status: string;
    midtransTransactionId: string;
    paymentType: string;
    midtransResponse: any;
    subscriptionId: string;
  }>,
) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findByOrderId(orderId);

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of entries) {
    const column = updateFieldMap[key];
    if (!column) continue;
    const finalValue =
      key === 'midtransResponse' && value !== null
        ? JSON.stringify(value)
        : value;
    setClauses.push(`${column} = $${paramIndex}`);
    values.push(finalValue);
    paramIndex++;
  }

  if (setClauses.length === 0) return findByOrderId(orderId);

  setClauses.push(`updated_at = NOW()`);
  values.push(orderId);

  const result = await query(
    `UPDATE payments
     SET ${setClauses.join(', ')}
     WHERE midtrans_order_id = $${paramIndex}
     RETURNING ${SELECT_COLUMNS}`,
    values,
  );
  return result.rows[0] || null;
}

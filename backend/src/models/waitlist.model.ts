import { query } from '../config/database';

export async function joinWaitlist(data: {
  userId: string | null;
  email: string;
  planId: number;
}) {
  const result = await query(
    `INSERT INTO pricing_waitlist (user_id, email, plan_id)
     VALUES ($1, $2, $3)
     RETURNING id, user_id AS "userId", email, plan_id AS "planId", created_at AS "createdAt"`,
    [data.userId, data.email, data.planId]
  );
  return result.rows[0];
}

export async function checkWaitlistStatus(email: string, planId: number, userId?: string | null) {
  let sql = 'SELECT id FROM pricing_waitlist WHERE plan_id = $1 AND (email = $2';
  const params: any[] = [planId, email];
  
  if (userId) {
    sql += ' OR user_id = $3';
    params.push(userId);
  }
  sql += ')';
  
  const result = await query(sql, params);
  return result.rows.length > 0;
}

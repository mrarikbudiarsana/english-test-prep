import { query } from '../config/database';

// ---------- helpers ----------

const fieldMap: Record<string, string> = {
  displayName: 'display_name',
  photoUrl: 'photo_url',
  role: 'role',
  isActive: 'is_active',
  freeTestsRemaining: 'free_tests_remaining',
  preferredExamType: 'preferred_exam_type',
  country: 'country',
  city: 'city',
};

const SELECT_COLUMNS = `
  id,
  firebase_uid         AS "firebaseUid",
  email,
  display_name         AS "displayName",
  photo_url            AS "photoUrl",
  role,
  is_active            AS "isActive",
  free_tests_remaining AS "freeTestsRemaining",
  preferred_exam_type  AS "preferredExamType",
  country,
  city,
  created_at           AS "createdAt",
  updated_at           AS "updatedAt"
`;

// ---------- queries ----------

export async function findById(id: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM users
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function findByFirebaseUid(firebaseUid: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM users
     WHERE firebase_uid = $1`,
    [firebaseUid],
  );
  return result.rows[0] || null;
}

export async function findByEmail(email: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM users
     WHERE email = $1`,
    [email],
  );
  return result.rows[0] || null;
}

export async function create(data: {
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  country?: string | null;
  city?: string | null;
}) {
  const result = await query(
    `INSERT INTO users (firebase_uid, email, display_name, photo_url, country, city, preferred_exam_type)
     VALUES ($1, $2, $3, $4, $5, $6, 'toefl_itp')
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.firebaseUid,
      data.email,
      data.displayName ?? null,
      data.photoUrl ?? null,
      data.country ?? null,
      data.city ?? null,
    ],
  );
  return result.rows[0];
}

export async function update(
  id: string,
  data: Partial<{
    displayName: string;
    photoUrl: string;
    role: string;
    isActive: boolean;
    freeTestsRemaining: number;
    preferredExamType: string;
    country: string | null;
    city: string | null;
  }>,
) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findById(id);

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of entries) {
    const column = fieldMap[key];
    if (!column) continue;
    setClauses.push(`${column} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  if (setClauses.length === 0) return findById(id);

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE users
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${SELECT_COLUMNS}`,
    values,
  );
  return result.rows[0] || null;
}

export async function decrementFreeTests(id: string) {
  const result = await query(
    `UPDATE users
     SET free_tests_remaining = free_tests_remaining - 1,
         updated_at = NOW()
     WHERE id = $1 AND free_tests_remaining > 0
     RETURNING ${SELECT_COLUMNS}`,
    [id],
  );
  return result.rows[0] || null;
}

export async function findAll(offset: number = 0, limit: number = 20) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM users
     ORDER BY created_at DESC
     OFFSET $1 LIMIT $2`,
    [offset, limit],
  );

  const countResult = await query('SELECT COUNT(*) FROM users');
  return {
    rows: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

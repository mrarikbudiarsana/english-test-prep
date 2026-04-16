import { query } from '../config/database';

// ---------- helpers ----------

export type TestType = 'academic' | 'general_training' | 'toefl_ibt' | 'toefl_itp' | 'pte_academic';

const fieldMap: Record<string, string> = {
  title: 'title',
  description: 'description',
  testType: 'test_type',
  isPublished: 'is_published',
  isFree: 'is_free',
  durationMinutes: 'duration_minutes',
  deliveryModel: 'delivery_model',
  blueprintJson: 'blueprint_json',
};

const SELECT_COLUMNS = `
  id,
  title,
  description,
  test_type        AS "testType",
  delivery_model   AS "deliveryModel",
  blueprint_json   AS "blueprintJson",
  is_published     AS "isPublished",
  is_free          AS "isFree",
  duration_minutes AS "durationMinutes",
  created_by       AS "createdBy",
  created_at       AS "createdAt",
  updated_at       AS "updatedAt"
`;

// ---------- queries ----------

export async function findById(id: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS} FROM tests WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function findAll(
  filters: { isPublished?: boolean; testType?: string; testTypes?: string[] } = {},
  offset: number = 0,
  limit: number = 20,
) {
  const conditions: string[] = ['is_published = true'];
  const values: any[] = [];
  let paramIndex = 1;

  // Support filtering by multiple test types (array)
  if (filters.testTypes !== undefined && filters.testTypes.length > 0) {
    conditions.push(`test_type = ANY($${paramIndex}::text[])`);
    values.push(filters.testTypes);
    paramIndex++;
  } else if (filters.testType !== undefined) {
    // Support single test type filter (backwards compatible)
    conditions.push(`test_type = $${paramIndex}`);
    values.push(filters.testType);
    paramIndex++;
  }

  if (filters.isPublished !== undefined) {
    // override the default is_published=true with an explicit filter
    conditions[0] = `is_published = $${paramIndex}`;
    values.push(filters.isPublished);
    paramIndex++;
  }

  values.push(offset, limit);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM tests
     ${whereClause}
     ORDER BY created_at DESC
     OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`,
    values,
  );

  const countValues = values.slice(0, values.length - 2);
  const countResult = await query(
    `SELECT COUNT(*) FROM tests ${whereClause}`,
    countValues,
  );

  return {
    rows: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function findAllAdmin(offset: number = 0, limit: number = 20) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM tests
     ORDER BY created_at DESC
     OFFSET $1 LIMIT $2`,
    [offset, limit],
  );

  const countResult = await query('SELECT COUNT(*) FROM tests');
  return {
    rows: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function create(data: {
  title: string;
  description?: string;
  testType: string;
  deliveryModel?: string;
  blueprintJson?: any;
  isFree?: boolean;
  createdBy?: string;
  durationMinutes?: number;
}) {
  const deliveryModel = data.deliveryModel ?? 'legacy';
  
  const durationMap: Record<string, number> = {
    academic: 165,
    general_training: 165,
    toefl_ibt: 117,
    toefl_itp: 115,
    pte_academic: 120,
  };
  const durationMinutes = data.durationMinutes ?? durationMap[data.testType] ?? 120;

  const result = await query(
    `INSERT INTO tests (title, description, test_type, delivery_model, blueprint_json, is_free, duration_minutes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.title,
      data.description ?? null,
      data.testType,
      deliveryModel,
      data.blueprintJson != null ? JSON.stringify(data.blueprintJson) : null,
      data.isFree ?? false,
      durationMinutes,
      data.createdBy ?? null,
    ],
  );
  return result.rows[0];
}

export async function update(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    testType: string;
    isPublished: boolean;
    isFree: boolean;
    durationMinutes: number;
    blueprintJson: any;
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
    const finalValue = key === 'blueprintJson' && value !== null
      ? JSON.stringify(value)
      : value;
    setClauses.push(`${column} = $${paramIndex}`);
    values.push(finalValue);
    paramIndex++;
  }

  if (setClauses.length === 0) return findById(id);

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE tests
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${SELECT_COLUMNS}`,
    values,
  );
  return result.rows[0] || null;
}

export async function remove(id: string) {
  const result = await query(
    'DELETE FROM tests WHERE id = $1 RETURNING id',
    [id],
  );
  return result.rowCount! > 0;
}

export async function publish(id: string, isPublished: boolean) {
  const result = await query(
    `UPDATE tests
     SET is_published = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING ${SELECT_COLUMNS}`,
    [isPublished, id],
  );
  return result.rows[0] || null;
}

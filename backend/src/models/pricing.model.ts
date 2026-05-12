import { query } from '../config/database';

// ---------- helpers ----------

const SELECT_COLUMNS = `
  id,
  name,
  description,
  price_monthly AS "priceMonthly",
  price_yearly AS "priceYearly",
  currency,
  perks,
  is_active AS "isActive",
  is_popular AS "isPopular",
  tier_level AS "tierLevel",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    priceMonthly: 'price_monthly',
    priceYearly: 'price_yearly',
    currency: 'currency',
    perks: 'perks',
    isActive: 'is_active',
    isPopular: 'is_popular',
    tierLevel: 'tier_level',
};

// ---------- queries ----------

export async function findAll(includeInactive: boolean = false) {
    let sql = `SELECT ${SELECT_COLUMNS} FROM pricing_plans`;
    if (!includeInactive) {
        sql += ` WHERE is_active = true`;
    }
    sql += ` ORDER BY tier_level ASC`;

    const result = await query(sql);
    return result.rows;
}

export async function findById(id: number) {
    const result = await query(
        `SELECT ${SELECT_COLUMNS} FROM pricing_plans WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

export async function create(data: {
    name: string;
    description?: string;
    priceMonthly: number;
    priceYearly: number;
    currency?: string;
    perks?: string[];
    isActive?: boolean;
    isPopular?: boolean;
    tierLevel?: number;
}) {
    const result = await query(
        `INSERT INTO pricing_plans (
      name, description, price_monthly, price_yearly, currency, perks, is_active, is_popular, tier_level
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING ${SELECT_COLUMNS}`,
        [
            data.name,
            data.description || null,
            data.priceMonthly,
            data.priceYearly,
            data.currency || 'IDR',
            data.perks || [],
            data.isActive ?? true,
            data.isPopular ?? false,
            data.tierLevel ?? 0,
        ]
    );
    return result.rows[0];
}

export async function update(
    id: number,
    data: Partial<{
        name: string;
        description: string;
        priceMonthly: number;
        priceYearly: number;
        currency: string;
        perks: string[];
        isActive: boolean;
        isPopular: boolean;
        tierLevel: number;
    }>
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
        `UPDATE pricing_plans
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${SELECT_COLUMNS}`,
        values
    );
    return result.rows[0] || null;
}

export async function remove(id: number) {
    await query('DELETE FROM pricing_plans WHERE id = $1', [id]);
}

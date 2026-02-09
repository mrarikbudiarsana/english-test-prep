import { query } from '../config/database';

// ---------- helpers ----------

const fieldMap: Record<string, string> = {
  testId: 'test_id',
  sectionType: 'section_type',
  sectionOrder: 'section_order',
  title: 'title',
  instructions: 'instructions',
  durationMinutes: 'duration_minutes',
  audioUrl: 'audio_url',
  passageText: 'passage_text',
  passageTitle: 'passage_title',
  taskDescription: 'task_description',
  taskNumber: 'task_number',
  minWords: 'min_words',
  imageUrl: 'image_url',
  partNumber: 'part_number',
  speakingPrompts: 'speaking_prompts',
  preparationTime: 'preparation_time',
  responseTime: 'response_time',
};

const SELECT_COLUMNS = `
  id,
  test_id           AS "testId",
  section_type      AS "sectionType",
  section_order     AS "sectionOrder",
  title,
  instructions,
  duration_minutes  AS "durationMinutes",
  audio_url         AS "audioUrl",
  passage_text      AS "passageText",
  passage_title     AS "passageTitle",
  task_description  AS "taskDescription",
  task_number       AS "taskNumber",
  min_words         AS "minWords",
  image_url         AS "imageUrl",
  part_number       AS "partNumber",
  speaking_prompts  AS "speakingPrompts",
  preparation_time  AS "preparationTime",
  response_time     AS "responseTime",
  created_at        AS "createdAt",
  updated_at        AS "updatedAt"
`;

// ---------- queries ----------

export async function findById(id: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS} FROM sections WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function findByTestId(testId: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM sections
     WHERE test_id = $1
     ORDER BY section_order ASC`,
    [testId],
  );
  return result.rows;
}

export async function findByTestIdAndType(testId: string, sectionType: string) {
  const result = await query(
    `SELECT ${SELECT_COLUMNS}
     FROM sections
     WHERE test_id = $1 AND section_type = $2
     ORDER BY section_order ASC`,
    [testId, sectionType],
  );
  return result.rows;
}

export async function create(data: {
  testId: string;
  sectionType: string;
  sectionOrder: number;
  title?: string;
  instructions?: string;
  durationMinutes: number;
  audioUrl?: string;
  passageText?: string;
  passageTitle?: string;
  taskDescription?: string;
  taskNumber?: number;
  minWords?: number;
  imageUrl?: string;
  partNumber?: number;
  speakingPrompts?: any;
  preparationTime?: number;
  responseTime?: number;
}) {
  const result = await query(
    `INSERT INTO sections (
       test_id, section_type, section_order, title, instructions,
       duration_minutes, audio_url, passage_text, passage_title,
       task_description, task_number, min_words, image_url,
       part_number, speaking_prompts, preparation_time, response_time
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.testId,
      data.sectionType,
      data.sectionOrder,
      data.title ?? null,
      data.instructions ?? null,
      data.durationMinutes,
      data.audioUrl ?? null,
      data.passageText ?? null,
      data.passageTitle ?? null,
      data.taskDescription ?? null,
      data.taskNumber ?? null,
      data.minWords ?? null,
      data.imageUrl ?? null,
      data.partNumber ?? null,
      data.speakingPrompts ? JSON.stringify(data.speakingPrompts) : null,
      data.preparationTime ?? null,
      data.responseTime ?? null,
    ],
  );
  return result.rows[0];
}

export async function update(
  id: string,
  data: Partial<{
    sectionType: string;
    sectionOrder: number;
    title: string;
    instructions: string;
    durationMinutes: number;
    audioUrl: string;
    passageText: string;
    passageTitle: string;
    taskDescription: string;
    taskNumber: number;
    minWords: number;
    imageUrl: string;
    partNumber: number;
    speakingPrompts: any;
    preparationTime: number;
    responseTime: number;
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
    const finalValue = key === 'speakingPrompts' && value !== null
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
    `UPDATE sections
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${SELECT_COLUMNS}`,
    values,
  );
  return result.rows[0] || null;
}

export async function remove(id: string) {
  const result = await query(
    'DELETE FROM sections WHERE id = $1 RETURNING id',
    [id],
  );
  return result.rowCount! > 0;
}

export async function getMaxOrder(testId: string) {
  const result = await query(
    'SELECT COALESCE(MAX(section_order), 0) AS "maxOrder" FROM sections WHERE test_id = $1',
    [testId],
  );
  return parseInt(result.rows[0].maxOrder, 10);
}

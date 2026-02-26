export type PteBlueprintValidationResult = {
  valid: boolean;
  errors: string[];
};

export type PteBlueprintPreviewResult = {
  valid: boolean;
  errors: string[];
  readingCounts: Record<string, number>;
  listeningCounts: Record<string, number>;
  readingRules: Record<string, PteBlueprintRule>;
  listeningRules: Record<string, PteBlueprintRule>;
};

export type PteBlueprintRule = { min: number; max: number };

export const PTE_READING_RULES: Record<string, PteBlueprintRule> = {
  pte_reading_fill_blanks_dropdown: { min: 5, max: 6 },
  pte_mcq_multiple: { min: 2, max: 3 },
  pte_reorder_paragraph: { min: 2, max: 3 },
  pte_reading_fill_blanks_drag_drop: { min: 4, max: 5 },
  pte_mcq_single: { min: 2, max: 3 },
};

export const PTE_LISTENING_RULES: Record<string, PteBlueprintRule> = {
  pte_mcq_multiple: { min: 2, max: 3 },
  pte_listening_fill_blanks: { min: 2, max: 3 },
  pte_highlight_correct_summary: { min: 2, max: 3 },
  pte_mcq_single: { min: 2, max: 3 },
  pte_select_missing_word: { min: 1, max: 2 },
  pte_highlight_incorrect_words: { min: 2, max: 3 },
  pte_write_from_dictation: { min: 3, max: 4 },
};

function countByType(rows: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const t = String(row.questionType || row.question_type || '');
    if (!t) continue;
    map[t] = (map[t] || 0) + 1;
  }
  return map;
}

function validateSectionRules(
  sectionLabel: 'reading' | 'listening',
  rows: any[],
  rules: Record<string, PteBlueprintRule>,
): string[] {
  const errors: string[] = [];
  const counts = countByType(rows);
  const allowedTypes = new Set(Object.keys(rules));

  for (const type of Object.keys(counts)) {
    if (!allowedTypes.has(type) && type.startsWith('pte_')) {
      errors.push(`PTE ${sectionLabel}: unsupported question type "${type}"`);
    }
  }

  for (const [type, rule] of Object.entries(rules)) {
    const n = counts[type] || 0;
    if (n < rule.min || n > rule.max) {
      errors.push(
        `PTE ${sectionLabel}: "${type}" count must be ${rule.min}-${rule.max} (found ${n})`,
      );
    }
  }

  return errors;
}

export function validatePteBlueprint(questions: any[]): PteBlueprintValidationResult {
  const errors: string[] = [];
  const pteQuestions = questions.filter((q) => String(q.questionType || q.question_type || '').startsWith('pte_'));

  if (pteQuestions.length === 0) {
    return { valid: false, errors: ['PTE blueprint: no PTE question items found'] };
  }

  const readingRows = pteQuestions.filter((q) => String(q.sectionType || q.section_type || '') === 'reading');
  const listeningRows = pteQuestions.filter((q) => String(q.sectionType || q.section_type || '') === 'listening');
  const outOfScopeRows = pteQuestions.filter((q) => {
    const s = String(q.sectionType || q.section_type || '');
    return s !== 'reading' && s !== 'listening';
  });

  if (outOfScopeRows.length > 0) {
    const bad = [...new Set(outOfScopeRows.map((q) => String(q.sectionType || q.section_type || 'unknown')))].join(', ');
    errors.push(`PTE blueprint: objective PTE question items must be in reading/listening sections (found in: ${bad})`);
  }

  errors.push(...validateSectionRules('reading', readingRows, PTE_READING_RULES));
  errors.push(...validateSectionRules('listening', listeningRows, PTE_LISTENING_RULES));

  return { valid: errors.length === 0, errors };
}

export function previewPteBlueprint(questions: any[]): PteBlueprintPreviewResult {
  const pteQuestions = questions.filter((q) => String(q.questionType || q.question_type || '').startsWith('pte_'));
  const readingRows = pteQuestions.filter((q) => String(q.sectionType || q.section_type || '') === 'reading');
  const listeningRows = pteQuestions.filter((q) => String(q.sectionType || q.section_type || '') === 'listening');

  const readingCounts = countByType(readingRows);
  const listeningCounts = countByType(listeningRows);
  const errors = validatePteBlueprint(questions).errors;

  return {
    valid: errors.length === 0,
    errors,
    readingCounts,
    listeningCounts,
    readingRules: PTE_READING_RULES,
    listeningRules: PTE_LISTENING_RULES,
  };
}

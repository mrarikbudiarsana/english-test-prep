function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

export function getPteDerivedMaxPoints(questionType: string, correctAnswer: any): number | null {
  switch (questionType) {
    case 'pte_mcq_multiple':
    case 'pte_highlight_incorrect_words': {
      if (!Array.isArray(correctAnswer)) return 1;
      return Math.max(1, correctAnswer.length);
    }

    case 'pte_reading_fill_blanks_dropdown':
    case 'pte_reading_fill_blanks_drag_drop':
    case 'pte_listening_fill_blanks': {
      if (!correctAnswer || typeof correctAnswer !== 'object' || Array.isArray(correctAnswer)) return 1;
      return Math.max(1, Object.keys(correctAnswer).length);
    }

    case 'pte_reorder_paragraph': {
      if (!Array.isArray(correctAnswer)) return 1;
      return Math.max(1, correctAnswer.length - 1);
    }

    case 'pte_write_from_dictation': {
      if (typeof correctAnswer !== 'string') return 1;
      return Math.max(1, countWords(correctAnswer));
    }

    default:
      return null;
  }
}

export function validatePteConfiguredPoints(
  questionType: string,
  correctAnswer: any,
  configuredPoints: number | null | undefined,
): string | null {
  const derived = getPteDerivedMaxPoints(questionType, correctAnswer);
  if (derived === null) return null;

  const safePoints =
    typeof configuredPoints === 'number' && Number.isFinite(configuredPoints)
      ? configuredPoints
      : 1;

  if (safePoints < derived) {
    return `Configured points (${safePoints}) is lower than derived max (${derived}) for ${questionType}`;
  }

  return null;
}

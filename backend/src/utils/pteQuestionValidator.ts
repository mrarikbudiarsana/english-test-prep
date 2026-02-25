export type PteValidationResult = {
  valid: boolean;
  errors: string[];
};

function isObject(value: any): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateChoiceOptions(questionData: any): string[] {
  const errors: string[] = [];
  if (!isObject(questionData)) {
    errors.push('questionData must be an object');
    return errors;
  }
  if (!Array.isArray(questionData.options) || questionData.options.length < 2) {
    errors.push('questionData.options must contain at least 2 options');
    return errors;
  }
  questionData.options.forEach((opt: any, idx: number) => {
    if (!isObject(opt)) {
      errors.push(`option[${idx}] must be an object`);
      return;
    }
    if (!isNonEmptyString(opt.key)) errors.push(`option[${idx}].key is required`);
    if (!isNonEmptyString(opt.text)) errors.push(`option[${idx}].text is required`);
  });
  return errors;
}

export function validatePteQuestionPayload(
  questionType: string,
  questionData: any,
  correctAnswer: any,
): PteValidationResult {
  const errors: string[] = [];

  switch (questionType) {
    case 'pte_mcq_single':
    case 'pte_highlight_correct_summary':
    case 'pte_select_missing_word': {
      errors.push(...validateChoiceOptions(questionData));
      if (!isNonEmptyString(correctAnswer)) {
        errors.push('correctAnswer must be a non-empty option key');
      }
      break;
    }

    case 'pte_mcq_multiple': {
      errors.push(...validateChoiceOptions(questionData));
      if (!Array.isArray(correctAnswer) || correctAnswer.length === 0) {
        errors.push('correctAnswer must be a non-empty array of option keys');
      }
      break;
    }

    case 'pte_reading_fill_blanks_dropdown': {
      if (!isObject(questionData)) {
        errors.push('questionData must be an object');
        break;
      }
      if (!isNonEmptyString(questionData.context)) {
        errors.push('questionData.context is required');
      }
      if (!isObject(questionData.blanks) || Object.keys(questionData.blanks).length === 0) {
        errors.push('questionData.blanks must be a non-empty object');
      } else {
        Object.entries(questionData.blanks).forEach(([key, val]) => {
          if (!isObject(val) || !Array.isArray((val as any).options) || (val as any).options.length < 2) {
            errors.push(`questionData.blanks.${key}.options must contain at least 2 options`);
          }
          if (isNonEmptyString(questionData.context) && !questionData.context.includes(`{${key}}`)) {
            errors.push(`context is missing placeholder {${key}}`);
          }
        });
      }
      if (!isObject(correctAnswer) || Object.keys(correctAnswer).length === 0) {
        errors.push('correctAnswer must be a non-empty object mapping blank ids');
      }
      break;
    }

    case 'pte_reading_fill_blanks_drag_drop': {
      if (!isObject(questionData)) {
        errors.push('questionData must be an object');
        break;
      }
      if (!Array.isArray(questionData.textSegments) || questionData.textSegments.length < 2) {
        errors.push('questionData.textSegments must contain at least 2 segments');
      }
      if (!Array.isArray(questionData.blankIds) || questionData.blankIds.length === 0) {
        errors.push('questionData.blankIds must be a non-empty array');
      }
      if (Array.isArray(questionData.textSegments) && Array.isArray(questionData.blankIds)) {
        const expectedSegments = questionData.blankIds.length + 1;
        if (questionData.textSegments.length !== expectedSegments) {
          errors.push(`questionData.textSegments must have ${expectedSegments} segments (blank count + 1)`);
        }
      }
      if (!Array.isArray(questionData.options) || questionData.options.length === 0) {
        errors.push('questionData.options must be a non-empty array');
      }
      if (!isObject(correctAnswer) || Object.keys(correctAnswer).length === 0) {
        errors.push('correctAnswer must be a non-empty object mapping blank ids');
      } else if (Array.isArray(questionData.blankIds)) {
        const missing = questionData.blankIds.filter((id: string) => !isNonEmptyString(correctAnswer[id]));
        if (missing.length > 0) {
          errors.push(`correctAnswer is missing values for: ${missing.join(', ')}`);
        }
      }
      break;
    }

    case 'pte_listening_fill_blanks': {
      if (!isObject(questionData)) {
        errors.push('questionData must be an object');
        break;
      }
      if (!isNonEmptyString(questionData.transcript)) {
        errors.push('questionData.transcript is required');
      }
      if (!Array.isArray(questionData.blankIds) || questionData.blankIds.length === 0) {
        errors.push('questionData.blankIds must be a non-empty array');
      } else if (isNonEmptyString(questionData.transcript)) {
        questionData.blankIds.forEach((id: string) => {
          if (!questionData.transcript.includes(`{${id}}`)) {
            errors.push(`transcript is missing placeholder {${id}}`);
          }
        });
      }
      if (!isObject(correctAnswer) || Object.keys(correctAnswer).length === 0) {
        errors.push('correctAnswer must be a non-empty object mapping blank ids');
      } else if (Array.isArray(questionData.blankIds)) {
        const missing = questionData.blankIds.filter((id: string) => !isNonEmptyString(correctAnswer[id]));
        if (missing.length > 0) {
          errors.push(`correctAnswer is missing values for: ${missing.join(', ')}`);
        }
      }
      break;
    }

    case 'pte_reorder_paragraph': {
      if (!isObject(questionData) || !Array.isArray(questionData.blocks) || questionData.blocks.length < 2) {
        errors.push('questionData.blocks must contain at least 2 blocks');
      } else {
        questionData.blocks.forEach((b: any, idx: number) => {
          if (!isObject(b)) {
            errors.push(`block[${idx}] must be an object`);
            return;
          }
          if (!isNonEmptyString(b.id)) errors.push(`block[${idx}].id is required`);
          if (!isNonEmptyString(b.text)) errors.push(`block[${idx}].text is required`);
        });
      }
      if (!Array.isArray(correctAnswer) || correctAnswer.length < 2) {
        errors.push('correctAnswer must be an ordered array of block ids');
      } else if (Array.isArray(questionData?.blocks)) {
        const blockIds = new Set(questionData.blocks.map((b: any) => b?.id));
        if (correctAnswer.some((id: any) => !blockIds.has(id))) {
          errors.push('correctAnswer includes block IDs that do not exist in blocks');
        }
        if (correctAnswer.length !== questionData.blocks.length) {
          errors.push('correctAnswer length must match blocks length');
        }
      }
      break;
    }

    case 'pte_highlight_incorrect_words': {
      if (!isObject(questionData)) {
        errors.push('questionData must be an object');
        break;
      }
      if (!isNonEmptyString(questionData.transcript)) {
        errors.push('questionData.transcript is required');
      }
      if (!Array.isArray(questionData.tokens) || questionData.tokens.length === 0) {
        errors.push('questionData.tokens must be a non-empty array');
      }
      if (!Array.isArray(correctAnswer)) {
        errors.push('correctAnswer must be an array of token ids');
      } else if (Array.isArray(questionData.tokens)) {
        const tokenIds = new Set(questionData.tokens.map((t: any) => t?.id));
        if (correctAnswer.some((id: any) => !tokenIds.has(id))) {
          errors.push('correctAnswer contains unknown token IDs');
        }
      }
      break;
    }

    case 'pte_write_from_dictation': {
      if (!isNonEmptyString(correctAnswer)) {
        errors.push('correctAnswer must be the target sentence text');
      }
      break;
    }

    default:
      return { valid: true, errors: [] };
  }

  return { valid: errors.length === 0, errors };
}

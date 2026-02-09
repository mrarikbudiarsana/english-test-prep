export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function checkMultipleChoice(
  userAnswer: any,
  correctAnswer: any
): boolean {
  if (Array.isArray(correctAnswer.answer)) {
    if (!Array.isArray(userAnswer.answer)) return false;
    const sorted1 = [...userAnswer.answer].sort();
    const sorted2 = [...correctAnswer.answer].sort();
    return JSON.stringify(sorted1) === JSON.stringify(sorted2);
  }
  return userAnswer.answer === correctAnswer.answer;
}

export function checkTrueFalseNotGiven(
  userAnswer: any,
  correctAnswer: any
): boolean {
  return normalizeAnswer(userAnswer.answer) === normalizeAnswer(correctAnswer.answer);
}

export function checkYesNoNotGiven(
  userAnswer: any,
  correctAnswer: any
): boolean {
  return normalizeAnswer(userAnswer.answer) === normalizeAnswer(correctAnswer.answer);
}

export function checkCompletion(
  userAnswer: any,
  correctAnswer: any
): boolean {
  const userNormalized = normalizeAnswer(userAnswer.answer || '');
  const acceptableAnswers: string[] = Array.isArray(correctAnswer.answer)
    ? correctAnswer.answer
    : [correctAnswer.answer];

  return acceptableAnswers.some(
    (acceptable: string) => normalizeAnswer(acceptable) === userNormalized
  );
}

export function checkMatching(
  userAnswer: any,
  correctAnswer: any
): { correct: number; total: number } {
  const correctMap = correctAnswer.answer as Record<string, string>;
  const userMap = (userAnswer.answer || {}) as Record<string, string>;
  let correct = 0;
  const total = Object.keys(correctMap).length;

  for (const key of Object.keys(correctMap)) {
    if (userMap[key] === correctMap[key]) {
      correct++;
    }
  }

  return { correct, total };
}

export function checkDropdown(
  userAnswer: any,
  correctAnswer: any
): { correct: number; total: number } {
  const correctMap = correctAnswer.answer as Record<string, string>;
  const userMap = (userAnswer.answer || {}) as Record<string, string>;
  let correct = 0;
  const total = Object.keys(correctMap).length;

  for (const key of Object.keys(correctMap)) {
    if (normalizeAnswer(userMap[key] || '') === normalizeAnswer(correctMap[key])) {
      correct++;
    }
  }

  return { correct, total };
}

export function checkAnswer(
  questionType: string,
  userAnswer: any,
  correctAnswer: any
): { isCorrect: boolean; score: number } {
  if (!userAnswer || !userAnswer.answer) {
    return { isCorrect: false, score: 0 };
  }

  switch (questionType) {
    case 'multiple_choice':
      return {
        isCorrect: checkMultipleChoice(userAnswer, correctAnswer),
        score: checkMultipleChoice(userAnswer, correctAnswer) ? 1 : 0,
      };

    case 'true_false_not_given':
      return {
        isCorrect: checkTrueFalseNotGiven(userAnswer, correctAnswer),
        score: checkTrueFalseNotGiven(userAnswer, correctAnswer) ? 1 : 0,
      };

    case 'yes_no_not_given':
      return {
        isCorrect: checkYesNoNotGiven(userAnswer, correctAnswer),
        score: checkYesNoNotGiven(userAnswer, correctAnswer) ? 1 : 0,
      };

    case 'completion':
      return {
        isCorrect: checkCompletion(userAnswer, correctAnswer),
        score: checkCompletion(userAnswer, correctAnswer) ? 1 : 0,
      };

    case 'matching': {
      const result = checkMatching(userAnswer, correctAnswer);
      return {
        isCorrect: result.correct === result.total,
        score: result.correct,
      };
    }

    case 'dropdown': {
      const result = checkDropdown(userAnswer, correctAnswer);
      return {
        isCorrect: result.correct === result.total,
        score: result.correct,
      };
    }

    default:
      return { isCorrect: false, score: 0 };
  }
}

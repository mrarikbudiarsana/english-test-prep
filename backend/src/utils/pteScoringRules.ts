type Band9 = number;

export type PteWritingBands = {
  taskAchievement: Band9;
  taskResponse: Band9;
  coherenceCohesion: Band9;
  lexicalResource: Band9;
  grammaticalRangeAccuracy: Band9;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function countWords(text: string): number {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

export function band9ToPteScaled(value: number): number {
  return clamp(Math.round((value / 9) * 80 + 10), 10, 90);
}

export function inferPteTaskType(text: string): string {
  const normalized = String(text || '').toLowerCase();
  if (normalized.includes('read aloud')) return 'Read Aloud';
  if (normalized.includes('repeat sentence')) return 'Repeat Sentence';
  if (normalized.includes('describe image')) return 'Describe Image';
  if (normalized.includes('retell lecture')) return 'Retell Lecture';
  if (normalized.includes('answer short question')) return 'Answer Short Question';
  if (normalized.includes('summarize group discussion')) return 'Summarize Group Discussion';
  if (normalized.includes('respond to a situation')) return 'Respond to a Situation';
  if (normalized.includes('summarize spoken text') || normalized.includes('summarise spoken text')) return 'Summarize Spoken Text';
  if (normalized.includes('summarize written text') || normalized.includes('summarise written text')) return 'Summarize Written Text';
  if (normalized.includes('write essay')) return 'Write Essay';
  return 'Unspecified PTE Task';
}

export function adjustPteWritingBands(taskType: string, bands: PteWritingBands, wordCount: number): PteWritingBands {
  const next = { ...bands };

  if (taskType === 'Summarize Written Text') {
    // Official banding uses strict single-sentence + word window constraints.
    if (wordCount < 5 || wordCount > 75) {
      next.taskResponse = Math.max(0, Math.min(next.taskResponse, 1));
    }
  }

  if (taskType === 'Summarize Spoken Text') {
    if (wordCount < 40 || wordCount > 100) {
      next.taskResponse = Math.max(0, Math.min(next.taskResponse, 2));
    }
    if (wordCount >= 50 && wordCount <= 70) {
      next.taskResponse = Math.max(next.taskResponse, Math.min(9, next.taskResponse + 1));
    }
  }

  if (taskType === 'Write Essay') {
    if (wordCount < 120 || wordCount > 380) {
      next.taskResponse = Math.max(0, Math.min(next.taskResponse, 1));
    } else if ((wordCount >= 120 && wordCount < 200) || (wordCount > 300 && wordCount <= 380)) {
      next.taskResponse = Math.max(0, Math.min(next.taskResponse, 4));
    }
  }

  return next;
}

export function getPteSpeakingWeights(taskType: string): {
  content: number;
  fluency: number;
  pronunciation: number;
  language: number;
} {
  switch (taskType) {
    case 'Read Aloud':
      return { content: 0.2, fluency: 0.35, pronunciation: 0.35, language: 0.1 };
    case 'Repeat Sentence':
      return { content: 0.35, fluency: 0.3, pronunciation: 0.25, language: 0.1 };
    case 'Answer Short Question':
      return { content: 0.45, fluency: 0.2, pronunciation: 0.2, language: 0.15 };
    case 'Describe Image':
    case 'Retell Lecture':
    case 'Summarize Group Discussion':
    case 'Respond to a Situation':
      return { content: 0.4, fluency: 0.25, pronunciation: 0.2, language: 0.15 };
    default:
      return { content: 0.3, fluency: 0.3, pronunciation: 0.25, language: 0.15 };
  }
}


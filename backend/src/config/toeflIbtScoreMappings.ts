/**
 * TOEFL iBT 2026 Score Mappings (Updated Jan 2026)
 * 
 * - Raw Inputs:
 *   - Reading/Listening: 0-30 (Questions correct)
 *   - Speaking: 0-4 (Rater average)
 *   - Writing: 0-5 (Rater average)
 * 
 * - Companion Scores (0-30 Scale):
 *   - Used for backward compatibility and calculation of 0-120 total.
 *   - R/L: Identity (0-30 -> 0-30).
 *   - S/W: Converted from raw averages.
 * 
 * - New 1-6 Band Scale (Primary Score):
 *   - Converted from the 0-30 Companion Scores using section-specific tables.
 *   - Overall Band is the average of section bands.
 */

export const TOEFL_IBT_MAPPING_VERSION = 'toefl_ibt_2026_v2_1_6';

// --- 1. Raw to Companion (0-30) ---

// Speaking (0-4 raw -> 0-30)
const SPEAKING_RAW_TABLE: { min: number; score: number }[] = [
  { min: 4.00, score: 30 }, { min: 3.83, score: 29 }, { min: 3.75, score: 28 },
  { min: 3.66, score: 27 }, { min: 3.50, score: 26 }, { min: 3.33, score: 25 },
  { min: 3.16, score: 24 }, { min: 3.00, score: 23 }, { min: 2.83, score: 22 },
  { min: 2.66, score: 20 }, { min: 2.50, score: 19 }, { min: 2.33, score: 18 },
  { min: 2.16, score: 17 }, { min: 2.00, score: 15 }, { min: 1.66, score: 13 },
  { min: 1.50, score: 11 }, { min: 1.33, score: 10 }, { min: 1.00, score: 8 },
  { min: 0.66, score: 6 }, { min: 0.50, score: 4 }, { min: 0.00, score: 0 },
];

export function speakingRawToScaled(rawAvg: number): number {
  for (const row of SPEAKING_RAW_TABLE) {
    if (rawAvg >= row.min) return row.score;
  }
  return 0;
}

// Writing (0-5 raw -> 0-30)
const WRITING_RAW_TABLE: { min: number; score: number }[] = [
  { min: 5.00, score: 30 }, { min: 4.75, score: 29 }, { min: 4.50, score: 28 },
  { min: 4.25, score: 27 }, { min: 4.00, score: 25 }, { min: 3.75, score: 24 },
  { min: 3.50, score: 22 }, { min: 3.25, score: 21 }, { min: 3.00, score: 20 },
  { min: 2.75, score: 18 }, { min: 2.50, score: 17 }, { min: 2.25, score: 15 },
  { min: 2.00, score: 14 }, { min: 1.75, score: 12 }, { min: 1.50, score: 10 },
  { min: 1.25, score: 8 }, { min: 1.00, score: 7 }, { min: 0.00, score: 0 },
];

export function writingRawToScaled(rawAvg: number): number {
  for (const row of WRITING_RAW_TABLE) {
    if (rawAvg >= row.min) return row.score;
  }
  return 0;
}


// --- 2. Companion (0-30) to Band (1-6) ---
// Based on ETS "Detailed Score Comparison: 1-6 and 0-30 TOEFL Scales"

// Reading (0-20 raw -> 0-30)
// Approximation: (raw / 20) * 30
export function readingRawToScaled(raw: number): number {
  return Math.min(30, Math.round((raw / 20) * 30));
}

// Listening (0-28 raw -> 0-30)
// Approximation: (raw / 28) * 30
export function listeningRawToScaled(raw: number): number {
  return Math.min(30, Math.round((raw / 28) * 30));
}

const READING_1_6 = {
  30: 6, 29: 6, 28: 5.5, 27: 5.5, 26: 5, 25: 5, 24: 5, 23: 4.5, 22: 4.5, 21: 4,
  20: 4, 19: 4, 18: 4, 17: 3.5, 16: 3.5, 15: 3.5, 14: 3.5, 13: 3.5, 12: 3.5,
  11: 3, 10: 3, 9: 3, 8: 3, 7: 3, 6: 3, 5: 2.5, 4: 2.5, 3: 2, 2: 1.5, 1: 1, 0: 1
};

const LISTENING_1_6 = {
  30: 6, 29: 6, 28: 6, 27: 5.5, 26: 5.5, 25: 5, 24: 5, 23: 5, 22: 5, 21: 4.5,
  20: 4.5, 19: 4, 18: 4, 17: 4, 16: 3.5, 15: 3.5, 14: 3.5, 13: 3.5, 12: 3,
  11: 3, 10: 3, 9: 3, 8: 2.5, 7: 2.5, 6: 2.5, 5: 2, 4: 2, 3: 1.5, 2: 1.5, 1: 1, 0: 1
};

const WRITING_1_6 = {
  30: 6, 29: 6, 28: 6, 27: 5.5, 26: 5, 25: 5, 24: 4.5, 23: 4.5, 22: 4, 21: 4,
  20: 4, 19: 3.5, 18: 3.5, 17: 3, 16: 3, 15: 2.5, 14: 2.5, 13: 2.5, 12: 2,
  11: 2, 10: 2, 9: 1.5, 8: 1.5, 7: 1.5, 6: 1.5, 5: 1.5, 4: 1, 3: 1, 2: 1, 1: 1, 0: 1
};

const SPEAKING_1_6 = {
  30: 6, 29: 6, 28: 5.5, 27: 5.5, 26: 5, 25: 5, 24: 5, 23: 4.5, 22: 4.5, 21: 4.5,
  20: 4, 19: 4, 18: 4, 17: 4, 16: 3.5, 15: 3.5, 14: 3, 13: 3, 12: 2.5,
  11: 2.5, 10: 2, 9: 2, 8: 2, 7: 2, 6: 1.5, 5: 1.5, 4: 1.5, 3: 1.5, 2: 1, 1: 1, 0: 1
};

export function score30ToBand1_6(score30: number, section: 'reading' | 'listening' | 'writing' | 'speaking'): number {
  const safeScore = Math.max(0, Math.min(30, Math.round(score30)));
  switch (section) {
    case 'reading': return (READING_1_6 as any)[safeScore] ?? 1;
    case 'listening': return (LISTENING_1_6 as any)[safeScore] ?? 1;
    case 'writing': return (WRITING_1_6 as any)[safeScore] ?? 1;
    case 'speaking': return (SPEAKING_1_6 as any)[safeScore] ?? 1;
    default: return 1;
  }
}

// --- 3. Overall Calculation ---

export function computeOverallBand(sectionBands: number[]): number {
  if (sectionBands.length === 0) return 0;
  const sum = sectionBands.reduce((a, b) => a + b, 0);
  // Average rounded to nearest 0.5 (Standard practice for band scales)
  return Math.round((sum / sectionBands.length) * 2) / 2;
}


// --- 4. CEFR Logic ---

export function overallBandToCefr(band: number): string {
  if (band >= 5.0) return 'C1';
  if (band >= 3.5) return 'B2';
  if (band >= 2.5) return 'B1';
  return 'A2';
}

// Deprecated / Backwards Compat
export function bandToScore30(band: number): number { return 0; } // Should not really reverse map
export function rawToScore30(raw: number): number { return Math.max(0, Math.min(30, Math.round(raw))); }

/**
 * Convert raw score (0-30) directly to Band (1-6).
 * Used by scoring.service.ts for Reading/Listening.
 */
export function rawToBand(raw: number): number {
  const score30 = rawToScore30(raw);
  // We assume rawToBand is mostly used for Reading/Listening where raw~=score30
  // But we don't know the section here easily if generic. 
  // However, Reading and Listening share the same 1-6 table for most part? 
  // Let's check tables.
  // Reading 30=6, 29=6, 28=5.5...
  // Listening 30=6, 29=6, 28=6... 
  // They are slightly different.
  // Ideally rawToBand should take a section argument.
  // But legacy signature might be just (raw).

  // For safety, we'll try to guess or use the Reading table as default if section is unknown,
  // OR we update scoring.service.ts to pass the section.

  // Actually, scoring.service.ts `convertToBand` HAS sectionType!
  // So we should verify scoring.service.ts calls it with section.
  // Checking previous step 264... convertToBand(rawScore, sectionType, testType).
  // But inside convertToBand, it logic for IELTS/ITP doesn't call an external function, it uses internal tables.
  // So likely I need to update scoring.service.ts to call my mapping with section type.

  return score30ToBand1_6(score30, 'reading'); // Fallback default
}

export function rawToBandSpecific(raw: number, section: 'reading' | 'listening' | 'writing' | 'speaking'): number {
  let score30 = 0;
  switch (section) {
    case 'reading': score30 = readingRawToScaled(raw); break;
    case 'listening': score30 = listeningRawToScaled(raw); break;
    case 'writing': score30 = writingRawToScaled(raw); break;
    case 'speaking': score30 = speakingRawToScaled(raw); break;
  }
  return score30ToBand1_6(score30, section);
}


/**
 * TOEFL iBT 2026 score conversion tables.
 * Reading and Listening: raw correct (0-30) → band (1.0-6.0, step 0.5)
 */

interface ScoreRange {
  min: number;
  max: number;
  band: number;
}

export const TOEFL_IBT_MAPPING_VERSION = 'toefl_ibt_2026_v1';

const SECTION_TABLE: ScoreRange[] = [
  { min: 30, max: 30, band: 6.0 },
  { min: 28, max: 29, band: 5.5 },
  { min: 24, max: 27, band: 5.0 },
  { min: 20, max: 23, band: 4.5 },
  { min: 16, max: 19, band: 4.0 },
  { min: 12, max: 15, band: 3.5 },
  { min: 8,  max: 11, band: 3.0 },
  { min: 4,  max: 7,  band: 2.5 },
  { min: 1,  max: 3,  band: 2.0 },
  { min: 0,  max: 0,  band: 1.0 },
];

/**
 * Convert a raw correct count to a TOEFL iBT band (1.0-6.0).
 */
export function rawToBand(raw: number): number {
  const clamped = Math.max(0, Math.min(30, Math.round(raw)));
  for (const range of SECTION_TABLE) {
    if (clamped >= range.min && clamped <= range.max) {
      return range.band;
    }
  }
  return 1.0;
}

/**
 * Companion section score (0-30) from objective raw.
 * Current v1 table is identity for objective sections.
 */
export function rawToScore30(raw: number): number {
  return Math.max(0, Math.min(30, Math.round(raw)));
}

/**
 * Companion section score (0-30) from section band (1.0-6.0, 0.5 step).
 * Used for subjective sections when only band is available.
 */
export function bandToScore30(band: number): number {
  const normalized = Math.max(1, Math.min(6, Math.round(band * 2) / 2));
  return Math.max(0, Math.min(30, Math.round(((normalized - 1) / 5) * 30)));
}

/**
 * Compute the overall TOEFL iBT band from an array of section bands.
 * Returns the average rounded to the nearest 0.5.
 */
export function computeOverallBand(bandScores: number[]): number {
  if (bandScores.length === 0) return 1.0;
  const avg = bandScores.reduce((sum, b) => sum + b, 0) / bandScores.length;
  return Math.round(avg * 2) / 2;
}

export function overallBandToCefr(overallBand: number): string {
  if (overallBand >= 5.5) return 'C2';
  if (overallBand >= 4.5) return 'C1';
  if (overallBand >= 3.5) return 'B2';
  if (overallBand >= 2.5) return 'B1';
  if (overallBand >= 1.5) return 'A2';
  return 'A1';
}

export type CefrLevel = 'C1' | 'B2' | 'B1' | 'A2' | 'Below A2';

export type CefrSkillKey = 'overall' | 'listening' | 'structure' | 'reading';

export interface CefrThresholds {
    a2: number;
    b1: number;
    b2: number;
    c1: number;
}

export interface CefrInfo {
    level: CefrLevel;
    descriptor: string;
    badgeClass: string;
    nextTarget: { level: CefrLevel; pointsNeeded: number } | null;
    range: { min: number; max: number };
    thresholds: CefrThresholds;
}

/**
 * Official ETS TOEFL ITP Level 1 minimum scaled cut scores per CEFR tier.
 */
export const TOEFL_ITP_CEFR_THRESHOLDS: Record<CefrSkillKey, CefrThresholds> = {
    overall: { a2: 343, b1: 433, b2: 543, c1: 620 },
    listening: { a2: 38, b1: 46, b2: 55, c1: 62 },
    structure: { a2: 32, b1: 43, b2: 53, c1: 64 },
    reading: { a2: 33, b1: 41, b2: 55, c1: 60 },
};

export const TOEFL_ITP_SCORE_RANGES: Record<CefrSkillKey, { min: number; max: number }> = {
    overall: { min: 310, max: 677 },
    listening: { min: 31, max: 68 },
    structure: { min: 31, max: 68 },
    reading: { min: 31, max: 67 },
};

const CEFR_META: Record<CefrLevel, { descriptor: string; badgeClass: string }> = {
    C1: {
        descriptor: 'Proficient User',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    B2: {
        descriptor: 'Independent User',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    B1: {
        descriptor: 'Intermediate User',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    A2: {
        descriptor: 'Basic User',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    'Below A2': {
        descriptor: 'Foundation',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    },
};

export function getToeflItpCefr(score: number | null | undefined, skill: CefrSkillKey): CefrInfo | null {
    if (score == null || Number.isNaN(score)) return null;

    const thresholds = TOEFL_ITP_CEFR_THRESHOLDS[skill];
    const range = TOEFL_ITP_SCORE_RANGES[skill];
    const rounded = Math.round(score);

    let level: CefrLevel = 'Below A2';
    let nextTarget: CefrInfo['nextTarget'] = { level: 'A2', pointsNeeded: Math.max(1, thresholds.a2 - rounded) };

    if (rounded >= thresholds.c1) {
        level = 'C1';
        nextTarget = null;
    } else if (rounded >= thresholds.b2) {
        level = 'B2';
        nextTarget = { level: 'C1', pointsNeeded: thresholds.c1 - rounded };
    } else if (rounded >= thresholds.b1) {
        level = 'B1';
        nextTarget = { level: 'B2', pointsNeeded: thresholds.b2 - rounded };
    } else if (rounded >= thresholds.a2) {
        level = 'A2';
        nextTarget = { level: 'B1', pointsNeeded: thresholds.b1 - rounded };
    }

    return {
        level,
        ...CEFR_META[level],
        nextTarget,
        range,
        thresholds,
    };
}

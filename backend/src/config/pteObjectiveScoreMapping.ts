export const PTE_OBJECTIVE_MAPPING_VERSION = 'pte_objective_2026_v1_0_0';

type Anchor = { ratio: number; score: number };

// Ratio raw/max -> scaled score (10..90), tuned to be less linear than direct ratio mapping.
// Keep midpoint (0.50 -> 50) stable to avoid abrupt behavior shifts for existing data.
const OBJECTIVE_ANCHORS: Anchor[] = [
  { ratio: 0.0, score: 10 },
  { ratio: 0.1, score: 19 },
  { ratio: 0.2, score: 28 },
  { ratio: 0.3, score: 36 },
  { ratio: 0.4, score: 43 },
  { ratio: 0.5, score: 50 },
  { ratio: 0.6, score: 57 },
  { ratio: 0.7, score: 64 },
  { ratio: 0.8, score: 72 },
  { ratio: 0.9, score: 81 },
  { ratio: 1.0, score: 90 },
];

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function ratioToPteObjectiveScore(ratio: number): number {
  const x = clampRatio(ratio);

  if (x <= OBJECTIVE_ANCHORS[0].ratio) return OBJECTIVE_ANCHORS[0].score;
  if (x >= OBJECTIVE_ANCHORS[OBJECTIVE_ANCHORS.length - 1].ratio) {
    return OBJECTIVE_ANCHORS[OBJECTIVE_ANCHORS.length - 1].score;
  }

  for (let i = 0; i < OBJECTIVE_ANCHORS.length - 1; i++) {
    const left = OBJECTIVE_ANCHORS[i];
    const right = OBJECTIVE_ANCHORS[i + 1];
    if (x >= left.ratio && x <= right.ratio) {
      const t = (x - left.ratio) / (right.ratio - left.ratio);
      const interpolated = left.score + t * (right.score - left.score);
      return Math.round(interpolated);
    }
  }

  return 10;
}

export function rawToPteObjectiveScore(rawScore: number, maxRawScore: number): number {
  const safeMax = maxRawScore > 0 ? maxRawScore : 1;
  const ratio = rawScore / safeMax;
  return ratioToPteObjectiveScore(ratio);
}

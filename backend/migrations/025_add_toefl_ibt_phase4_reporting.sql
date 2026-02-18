-- Migration 025: TOEFL iBT Phase 4 reporting + concordance fields
-- Additive only; does not modify legacy IELTS/TOEFL ITP/PTE rows.

ALTER TABLE attempts
  ADD COLUMN IF NOT EXISTS writing_raw SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS speaking_raw SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS reading_score_30 SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS listening_score_30 SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS writing_score_30 SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS speaking_score_30 SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS overall_score_120 SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS score_mapping_version VARCHAR(40) NOT NULL DEFAULT 'toefl_ibt_2026_v1',
  ADD COLUMN IF NOT EXISTS cefr_level VARCHAR(4) NULL,
  ADD COLUMN IF NOT EXISTS score_reportable BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS valid_until DATE NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'attempts_score_30_bounds_check'
  ) THEN
    ALTER TABLE attempts
      ADD CONSTRAINT attempts_score_30_bounds_check
      CHECK (
        (reading_score_30 IS NULL OR (reading_score_30 BETWEEN 0 AND 30)) AND
        (listening_score_30 IS NULL OR (listening_score_30 BETWEEN 0 AND 30)) AND
        (writing_score_30 IS NULL OR (writing_score_30 BETWEEN 0 AND 30)) AND
        (speaking_score_30 IS NULL OR (speaking_score_30 BETWEEN 0 AND 30)) AND
        (overall_score_120 IS NULL OR (overall_score_120 BETWEEN 0 AND 120))
      );
  END IF;
END $$;

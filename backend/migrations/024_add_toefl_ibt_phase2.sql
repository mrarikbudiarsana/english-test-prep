-- Migration 024: TOEFL iBT Phase 2 — item payload + adaptive path columns
-- Additive only; does not modify existing IELTS/TOEFL ITP data.

-- Rich item data for TOEFL iBT questions
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS item_payload JSONB NULL;

-- Adaptive routing path stored per attempt
ALTER TABLE attempts
  ADD COLUMN IF NOT EXISTS reading_path   VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS listening_path VARCHAR(10) NULL;

ALTER TABLE attempts
  ADD CONSTRAINT attempts_reading_path_check
    CHECK (reading_path IS NULL OR reading_path IN ('upper', 'lower')),
  ADD CONSTRAINT attempts_listening_path_check
    CHECK (listening_path IS NULL OR listening_path IN ('upper', 'lower'));

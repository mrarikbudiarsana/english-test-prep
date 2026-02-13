-- Migration 015: Add TOEFL iTP score columns to attempts table
-- TOEFL uses scaled scores (31-68 per section, 310-677 overall) not bands

ALTER TABLE attempts
  ADD COLUMN IF NOT EXISTS structure_raw     INTEGER,
  ADD COLUMN IF NOT EXISTS structure_score   DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS listening_score   DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS reading_score     DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS overall_score     DECIMAL(6,1);

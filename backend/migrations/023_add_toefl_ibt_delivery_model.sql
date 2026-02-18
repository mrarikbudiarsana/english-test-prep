-- Migration 023: Add delivery_model and blueprint_json to tests for TOEFL iBT 2026
-- Also adds MST-related columns to sections (used in Phase 2)
-- This migration is additive only and does not modify existing data.

-- Add delivery_model column to tests
ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS delivery_model VARCHAR(40) NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS blueprint_json JSONB NULL;

-- Add check constraint for delivery_model
ALTER TABLE tests
  ADD CONSTRAINT tests_delivery_model_check
  CHECK (delivery_model IN ('legacy', 'toefl_ibt_2026'));

-- Backfill any existing toefl_ibt rows to the correct delivery model
UPDATE tests
SET delivery_model = 'toefl_ibt_2026'
WHERE test_type = 'toefl_ibt' AND delivery_model = 'legacy';

-- Add MST/task columns to sections (for Phase 2 adaptive routing)
ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS module_stage SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS module_path  VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS task_type    VARCHAR(50) NULL;

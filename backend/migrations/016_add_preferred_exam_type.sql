-- Migration 016: Add preferred exam type to users table
-- Allows users to select their preferred exam (IELTS, TOEFL iBT, TOEFL ITP, PTE)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_exam_type VARCHAR(20)
  CHECK (preferred_exam_type IN ('ielts', 'toefl_ibt', 'toefl_itp', 'pte'));

CREATE INDEX IF NOT EXISTS idx_users_preferred_exam_type ON users(preferred_exam_type);

COMMENT ON COLUMN users.preferred_exam_type IS 'User selected exam type: ielts, toefl_ibt, toefl_itp, or pte';

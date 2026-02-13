-- Add exam_type to subscriptions and payments tables
-- Exam-specific subscriptions: each subscription is tied to one exam type

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS exam_type VARCHAR(20)
    CHECK (exam_type IN ('ielts', 'toefl_ibt', 'toefl_itp', 'pte'));

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS exam_type VARCHAR(20)
    CHECK (exam_type IN ('ielts', 'toefl_ibt', 'toefl_itp', 'pte'));

-- Backfill existing subscriptions/payments with 'ielts' as default
UPDATE subscriptions SET exam_type = 'ielts' WHERE exam_type IS NULL;
UPDATE payments SET exam_type = 'ielts' WHERE exam_type IS NULL;

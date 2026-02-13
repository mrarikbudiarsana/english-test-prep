-- Fix tests_test_type_check constraint to ensure all types are allowed
-- This mimics migration 012 but ensures it is applied in case 012 was skipped or overridden

ALTER TABLE tests
  DROP CONSTRAINT IF EXISTS tests_test_type_check;

ALTER TABLE tests
  ADD CONSTRAINT tests_test_type_check
  CHECK (test_type IN (
    'academic',
    'general_training',
    'toefl_ibt',
    'toefl_itp',
    'pte_academic'
  ));

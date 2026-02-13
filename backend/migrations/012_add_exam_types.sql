-- Migration 012: Extend test_type to support TOEFL and PTE exam types
-- Drop the existing check constraint and replace with an expanded one

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

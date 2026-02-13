-- Migration 019: Fix questions_question_type_check constraint
-- Re-apply the constraint from migration 011 as it seems to be missing in some environments
-- Also ensure all types including newer ones are present

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions
  ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN (
    'multiple_choice',
    'true_false_not_given',
    'yes_no_not_given',
    'completion',
    'matching',
    'dropdown',
    'writing_task',
    'speaking_response'
  ));

-- Allow writing_task and speaking_response as valid question types.
-- These are used for auto-created placeholder questions in writing/speaking sections,
-- which need a question row to satisfy the responses.question_id FK.
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

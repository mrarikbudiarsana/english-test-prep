-- Migration 029: Add explanation_ai column for AI-powered tutoring
-- Required by the recent AI explanation integration.

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS explanation_ai TEXT;

COMMENT ON COLUMN questions.explanation_ai IS 'AI-generated explanation for the question';

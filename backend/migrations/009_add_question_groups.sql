-- Add support for question groups with shared instructions
-- Example: "Questions 1-7" can share the instruction "Complete the notes below..."

ALTER TABLE questions
ADD COLUMN group_label VARCHAR(100),
ADD COLUMN group_instructions TEXT;

-- Add index for efficient grouping queries
CREATE INDEX idx_questions_group ON questions(section_id, group_label) WHERE group_label IS NOT NULL;

COMMENT ON COLUMN questions.group_label IS 'Optional label for question groups, e.g., "Questions 1-7"';
COMMENT ON COLUMN questions.group_instructions IS 'Shared instructions for all questions in this group';

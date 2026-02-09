CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id      UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type   VARCHAR(30) NOT NULL
                    CHECK (question_type IN (
                        'multiple_choice',
                        'true_false_not_given',
                        'yes_no_not_given',
                        'completion',
                        'matching',
                        'dropdown'
                    )),
    question_text   TEXT NOT NULL,
    question_data   JSONB NOT NULL DEFAULT '{}',
    correct_answer  JSONB NOT NULL,
    points          INTEGER DEFAULT 1,
    explanation     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_section ON questions(section_id, question_number);

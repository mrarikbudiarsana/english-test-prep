CREATE TABLE responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id      UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES questions(id),
    section_id      UUID NOT NULL REFERENCES sections(id),
    answer_data     JSONB NOT NULL,
    writing_text    TEXT,
    word_count      INTEGER,
    audio_url       TEXT,
    audio_duration  INTEGER,
    is_correct      BOOLEAN,
    score           DECIMAL(3,1),
    ai_feedback     JSONB,
    answered_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_attempt ON responses(attempt_id, section_id);
CREATE UNIQUE INDEX idx_responses_unique ON responses(attempt_id, question_id);

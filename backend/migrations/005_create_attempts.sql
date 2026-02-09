CREATE TABLE attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    test_id         UUID NOT NULL REFERENCES tests(id),
    mode            VARCHAR(20) DEFAULT 'full'
                    CHECK (mode IN ('full', 'section_practice')),
    practice_section_type VARCHAR(20),
    status          VARCHAR(20) DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'abandoned', 'scoring')),
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    current_section VARCHAR(20),
    section_started_at TIMESTAMPTZ,
    listening_raw   INTEGER,
    listening_band  DECIMAL(2,1),
    reading_raw     INTEGER,
    reading_band    DECIMAL(2,1),
    writing_band    DECIMAL(2,1),
    speaking_band   DECIMAL(2,1),
    overall_band    DECIMAL(2,1),
    writing_feedback JSONB,
    speaking_feedback JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attempts_user ON attempts(user_id, created_at DESC);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_attempts_test ON attempts(test_id);

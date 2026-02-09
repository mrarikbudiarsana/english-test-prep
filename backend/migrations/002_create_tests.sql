CREATE TABLE tests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    test_type       VARCHAR(20) NOT NULL DEFAULT 'academic'
                    CHECK (test_type IN ('academic', 'general_training')),
    is_published    BOOLEAN DEFAULT false,
    is_free         BOOLEAN DEFAULT false,
    duration_minutes INTEGER NOT NULL DEFAULT 170,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tests_published ON tests(is_published);
CREATE INDEX idx_tests_type ON tests(test_type);

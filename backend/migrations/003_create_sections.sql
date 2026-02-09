CREATE TABLE sections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id         UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    section_type    VARCHAR(20) NOT NULL
                    CHECK (section_type IN ('listening', 'reading', 'writing', 'speaking')),
    section_order   INTEGER NOT NULL,
    title           VARCHAR(255),
    instructions    TEXT,
    duration_minutes INTEGER NOT NULL,
    audio_url       TEXT,
    passage_text    TEXT,
    passage_title   VARCHAR(255),
    task_description TEXT,
    task_number     INTEGER,
    min_words       INTEGER,
    image_url       TEXT,
    part_number     INTEGER,
    speaking_prompts JSONB,
    preparation_time INTEGER,
    response_time   INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sections_test ON sections(test_id, section_order);
CREATE INDEX idx_sections_type ON sections(test_id, section_type);

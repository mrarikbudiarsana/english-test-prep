-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize maintenance_mode
INSERT INTO system_settings (key, value)
VALUES ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- Add test_credits column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS test_credits INTEGER NOT NULL DEFAULT 0;

-- Allow firebase_uid to be NULL so users created from Lynk webhook can register/link later
ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;

-- Create table for lynk webhook transactions
CREATE TABLE IF NOT EXISTS lynk_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(12,2),
    credits_added INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'paid',
    checkout_url VARCHAR(255),
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lynk_transactions_email ON lynk_transactions(email);
CREATE INDEX IF NOT EXISTS idx_lynk_transactions_tx_id ON lynk_transactions(transaction_id);

-- Create table for auditing test credit changes
CREATE TABLE IF NOT EXISTS test_credit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    change_amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    reference_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_credit_logs_user ON test_credit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_test_credit_logs_email ON test_credit_logs(email);

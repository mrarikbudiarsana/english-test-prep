CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    subscription_id UUID REFERENCES subscriptions(id),
    midtrans_order_id VARCHAR(100) UNIQUE NOT NULL,
    midtrans_transaction_id VARCHAR(255),
    snap_token      VARCHAR(255),
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'IDR',
    status          VARCHAR(30) DEFAULT 'pending'
                    CHECK (status IN (
                        'pending', 'capture', 'settlement',
                        'deny', 'cancel', 'expire', 'refund'
                    )),
    payment_type    VARCHAR(50),
    midtrans_response JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_order ON payments(midtrans_order_id);
CREATE INDEX idx_payments_status ON payments(status);

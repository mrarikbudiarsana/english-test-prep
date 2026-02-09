CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    plan_type       VARCHAR(30) NOT NULL
                    CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    starts_at       TIMESTAMPTZ NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    auto_renew      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_expiry ON subscriptions(expires_at);

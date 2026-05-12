CREATE TABLE IF NOT EXISTS pricing_waitlist (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  plan_id INTEGER REFERENCES pricing_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to prevent duplicate entries for the same user + plan
CREATE UNIQUE INDEX IF NOT EXISTS pricing_waitlist_user_plan_idx ON pricing_waitlist(user_id, plan_id);

-- Unique index to prevent duplicate entries for the same guest email + plan
CREATE UNIQUE INDEX IF NOT EXISTS pricing_waitlist_email_plan_idx ON pricing_waitlist(email, plan_id) WHERE user_id IS NULL;

CREATE TABLE IF NOT EXISTS pricing_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'IDR',
  perks TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  tier_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO pricing_plans (name, description, price_monthly, price_yearly, perks, is_active, is_popular, tier_level)
VALUES
  ('Free', 'Essential features for casual learners', 0, 0, ARRAY['Access to 1 full practice test per month', 'Basic performance analytics', 'Community forum access'], true, false, 1),
  ('Pro', 'Everything you need to improve fast', 99000, 990000, ARRAY['Unlimited practice tests', 'Detailed AI scoring & feedback', 'Performance tracking over time', 'Priority support'], true, true, 2),
  ('Team', 'For schools and organizations', 299000, 2990000, ARRAY['Everything in Pro', 'Team management dashboard', 'Bulk student progress reports', 'Dedicated account manager'], true, false, 3);

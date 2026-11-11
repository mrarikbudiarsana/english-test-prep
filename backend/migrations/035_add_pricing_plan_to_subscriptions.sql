ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pricing_plan_id INTEGER REFERENCES pricing_plans(id);

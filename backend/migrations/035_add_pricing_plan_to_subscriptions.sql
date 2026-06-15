ALTER TABLE subscriptions ADD COLUMN pricing_plan_id INTEGER REFERENCES pricing_plans(id);

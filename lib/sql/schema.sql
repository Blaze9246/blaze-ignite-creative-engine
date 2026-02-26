CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  store_url TEXT NOT NULL,
  country TEXT NOT NULL,
  month TEXT NOT NULL,
  theme TEXT,
  goal_preset TEXT NOT NULL,
  goal_other TEXT,
  promotion JSONB NOT NULL,
  max_products INT NOT NULL,
  image_provider TEXT NOT NULL,
  include_ugc BOOLEAN NOT NULL,
  include_promo BOOLEAN NOT NULL,
  cost_estimate_usd NUMERIC NOT NULL DEFAULT 0,
  cost_actual_usd NUMERIC NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  price NUMERIC,
  currency TEXT,
  image TEXT,
  description TEXT
);
CREATE TABLE IF NOT EXISTS creative_blocks (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id TEXT,
  code TEXT NOT NULL,
  payload JSONB NOT NULL,
  generated_image_url TEXT,
  generated_at TIMESTAMPTZ,
  actual_cost_usd NUMERIC
);

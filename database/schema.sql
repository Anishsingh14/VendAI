-- ============================================================
-- VendAI — Supabase Database Schema (Run in Supabase SQL Editor)
-- ============================================================

-- 1. vendors (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    city TEXT,
    email TEXT UNIQUE NOT NULL,
    alert_email TEXT,
    alert_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. machines
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active | inactive
    last_upload_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. products (auto-detected from CSV)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    is_priority BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active', -- active | inactive
    stock_remaining NUMERIC,
    first_yellow_date DATE,
    first_red_date DATE,
    model_confidence NUMERIC,
    data_confidence TEXT DEFAULT 'low', -- low | building | strong
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(machine_id, product_name)
);

-- 4. inventory_data (raw uploaded data)
CREATE TABLE IF NOT EXISTS inventory_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    date DATE NOT NULL,
    stock_added NUMERIC DEFAULT 0,
    units_consumed NUMERIC DEFAULT 0,
    stock_remaining NUMERIC,
    day_of_week TEXT,
    month TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(machine_id, product_name, date)
);

-- 5. predictions (ML output — 30 days per product)
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    prediction_date DATE NOT NULL,
    predicted_stock NUMERIC,
    stock_status TEXT, -- green | yellow | red | black
    confidence_level TEXT, -- high | medium | low | none
    model_confidence_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(machine_id, product_name, prediction_date)
);

-- 6. alert_log (dedup + history)
CREATE TABLE IF NOT EXISTS alert_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    alert_level TEXT NOT NULL, -- WARNING | CRITICAL | URGENT
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    predicted_date DATE
);

-- 7. product_change_log
CREATE TABLE IF NOT EXISTS product_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    machine_id UUID REFERENCES machines(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    change_type TEXT NOT NULL, -- added | deactivated | restored
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────────
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_change_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies — vendors can only see their own data
CREATE POLICY "vendor_own" ON vendors FOR ALL USING (auth.uid() = id);
CREATE POLICY "machine_own" ON machines FOR ALL USING (auth.uid() = vendor_id);
CREATE POLICY "product_own" ON products FOR ALL USING (auth.uid() = vendor_id);
CREATE POLICY "inventory_own" ON inventory_data FOR ALL USING (auth.uid() = vendor_id);
CREATE POLICY "prediction_own" ON predictions FOR ALL USING (auth.uid() = vendor_id);
CREATE POLICY "alert_own" ON alert_log FOR ALL USING (auth.uid() = vendor_id);
CREATE POLICY "log_own" ON product_change_log FOR ALL USING (auth.uid() = vendor_id);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inventory_machine_product ON inventory_data(machine_id, product_name);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory_data(date);
CREATE INDEX IF NOT EXISTS idx_predictions_machine_product ON predictions(machine_id, product_name);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_alert_log_vendor ON alert_log(vendor_id, sent_at);

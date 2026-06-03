-- PriceShield DB Wipe & Fresh Rebuild Schema
-- Copy and run this script in your Supabase SQL Editor.

-- SECTION 1: Drop all existing tables & functions safely with CASCADE
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS shopper_products CASCADE;
DROP TABLE IF EXISTS baselines CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS audit_jobs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS inbox_messages CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS increment_api_key_usage(text) CASCADE;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- SECTION 2: Recreate all tables

-- 1. PROFILES Table (User Settings & Profile)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY, -- Maps to Supabase/Firebase Auth UID
    email TEXT NOT NULL,
    display_name TEXT,
    tier TEXT DEFAULT 'free',
    api_keys TEXT[] DEFAULT '{}',
    telegram_chat_id TEXT,
    whatsapp_number TEXT,
    forwarding_emails TEXT[] DEFAULT '{}',
    alert_email TEXT,
    onesignal_player_id TEXT,
    alert_channels TEXT[] DEFAULT '{"email", "push"}',
    report_daily BOOLEAN DEFAULT TRUE,
    report_weekly BOOLEAN DEFAULT TRUE,
    report_monthly BOOLEAN DEFAULT TRUE,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    invoices_uploaded INTEGER DEFAULT 0,
    manual_uploads_count INTEGER DEFAULT 0,
    alert_threshold DOUBLE PRECISION DEFAULT 2.0,
    slack_webhook_url TEXT,
    slack_user_id TEXT,
    slack_team_id TEXT,
    ls_customer_id TEXT,
    ls_subscription_id TEXT,
    ls_subscription_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    country TEXT,
    timezone TEXT
);

-- 2. LOCATIONS Table
CREATE TABLE locations (
    id TEXT PRIMARY KEY, -- e.g. YYYYMMDDHHMMSS or UUID
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. API_KEYS Table
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY, -- Masks the active lookup
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    name TEXT DEFAULT 'Default',
    tier TEXT DEFAULT 'api_free',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_used_at TIMESTAMP WITH TIME ZONE,
    total_requests INTEGER DEFAULT 0,
    monthly_requests INTEGER DEFAULT 0,
    monthly_reset_date TEXT
);

-- 4. INVOICES Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    invoice_number TEXT,
    vendor_name TEXT NOT NULL,
    vendor_address TEXT,
    vendor_tax_id TEXT,
    customer_name TEXT,
    customer_address TEXT,
    invoice_date DATE,
    due_date DATE,
    subtotal NUMERIC,
    tax_total NUMERIC,
    grand_total NUMERIC,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
    raw_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    is_baseline BOOLEAN DEFAULT FALSE
);

-- 5. LINE_ITEMS Table
CREATE TABLE line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    sku TEXT,
    quantity NUMERIC DEFAULT 1,
    unit_of_measure TEXT,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC,
    confidence NUMERIC DEFAULT 1.0,
    position INTEGER DEFAULT 0
);

-- 6. ALERTS Table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- e.g. price_hike, all_clear, historical_audit
    vendor_name TEXT NOT NULL,
    message TEXT NOT NULL,
    total_margin_lost NUMERIC DEFAULT 0,
    flagged_items JSONB DEFAULT '[]',
    has_hikes BOOLEAN DEFAULT TRUE,
    channel TEXT DEFAULT 'telegram',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. INBOX_MESSAGES Table
CREATE TABLE inbox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT,
    text_body TEXT,
    html_body TEXT,
    has_attachments BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 8. CHAT_MESSAGES Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- e.g. user, assistant, system
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 9. AUDIT_JOBS Table
CREATE TABLE audit_jobs (
    id TEXT PRIMARY KEY, -- custom job UUID/string
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- e.g. processing, completed, failed
    progress INTEGER DEFAULT 0,
    invoices_processed INTEGER DEFAULT 0,
    total_historical_loss NUMERIC DEFAULT 0,
    total_hikes_found INTEGER DEFAULT 0,
    comparisons JSONB DEFAULT '[]',
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 10. AUDIT_LOGS Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES audit_jobs(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 11. BASELINES Table
CREATE TABLE baselines (
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    sku TEXT,
    unit_price NUMERIC NOT NULL,
    unit_of_measure TEXT,
    last_invoice_date DATE,
    PRIMARY KEY (user_id, vendor_name, item_name)
);

-- 12. SHOPPER_PRODUCTS Table
CREATE TABLE shopper_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_title TEXT,
    brand TEXT,
    gtin TEXT,
    mpn TEXT,
    image_url TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for Vector search on shopper_products
CREATE INDEX shopper_products_embedding_idx ON shopper_products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 13. API_USAGE Table
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id TEXT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    file_size_bytes INTEGER DEFAULT 0,
    items_extracted INTEGER DEFAULT 0,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Function to atomically increment API Key requests usage
CREATE OR REPLACE FUNCTION increment_api_key_usage(p_key_id text)
RETURNS void AS $$
BEGIN
  UPDATE api_keys
  SET total_requests = total_requests + 1,
      monthly_requests = monthly_requests + 1,
      last_used_at = TIMEZONE('utc', NOW())
  WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql;

-- DigiSewa Backend Database Schema
-- Run this in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Officers table
CREATE TABLE IF NOT EXISTS officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department TEXT,
  badge_number TEXT UNIQUE,
  permissions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  applicant_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  document_hash TEXT,
  document_storage_path TEXT,
  document_iv TEXT,
  document_auth_tag TEXT,
  license_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  user_id UUID,
  service_type TEXT,
  payload_hash TEXT NOT NULL,
  chain_tx TEXT,
  issued_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  revoke_reason TEXT,
  revoke_tx TEXT,
  revoke_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- Enable Row Level Security (optional - for production)
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Sample service types
INSERT INTO applications (user_id, service_type, applicant_data, status) VALUES
('00000000-0000-0000-0000-000000000001', 'trade_license', '{"name": "Test Business", "address": "123 Main St"}', 'pending'),
('00000000-0000-0000-0000-000000000002', 'food_license', '{"restaurant": "Test Restaurant", "owner": "John Doe"}', 'verified')
ON CONFLICT DO NOTHING;

-- Storage bucket for encrypted files (run this in Supabase Storage section)
-- CREATE BUCKET 'applications' WITH (public = false);

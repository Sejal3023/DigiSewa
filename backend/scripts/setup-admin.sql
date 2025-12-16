-- DigiSewa Admin Setup Script
-- Run this in Supabase SQL Editor to create admin system

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  department TEXT,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create admin access codes table
CREATE TABLE IF NOT EXISTS admin_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default admin user (password: Admin@2024)
INSERT INTO admin_users (email, password_hash, full_name, role, department, permissions) VALUES
(
  'admin@government.in',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO', -- Admin@2024
  'System Administrator',
  'super_admin',
  'IT Department',
  '{"all": true, "users": true, "applications": true, "licenses": true, "system": true}'
) ON CONFLICT (email) DO NOTHING;

-- Insert default admin access code
INSERT INTO admin_access_codes (code, description, permissions, expires_at) VALUES
(
  'ADMIN2024',
  'Default admin access code for system administration',
  '{"all": true, "users": true, "applications": true, "licenses": true, "system": true}',
  '2025-12-31 23:59:59'
) ON CONFLICT (code) DO NOTHING;

-- Insert additional admin users for different departments
INSERT INTO admin_users (email, password_hash, full_name, role, department, permissions) VALUES
(
  'officer@municipal.gov.in',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO', -- Admin@2024
  'Municipal Officer',
  'officer',
  'Municipal Corporation',
  '{"applications": true, "licenses": true, "verify": true, "issue": true}'
),
(
  'officer@rto.gov.in',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO', -- Admin@2024
  'RTO Officer',
  'officer',
  'Regional Transport Office',
  '{"applications": true, "licenses": true, "verify": true, "issue": true}'
),
(
  'officer@fssai.gov.in',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO', -- Admin@2024
  'FSSAI Officer',
  'officer',
  'Food & Drug Administration',
  '{"applications": true, "licenses": true, "verify": true, "issue": true}'
) ON CONFLICT (email) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_department ON admin_users(department);
CREATE INDEX IF NOT EXISTS idx_admin_access_codes_code ON admin_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin users can view their own profile" ON admin_users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Super admins can view all admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid()::uuid 
      AND au.role = 'super_admin'
    )
  );

CREATE POLICY "Public access to active access codes" ON admin_access_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin users can manage their own sessions" ON admin_sessions
  FOR ALL USING (admin_user_id = auth.uid()::uuid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON admin_users TO anon, authenticated;
GRANT ALL ON admin_access_codes TO anon, authenticated;
GRANT ALL ON admin_sessions TO anon, authenticated;

-- Create view for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  COUNT(*) as total_applications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications
FROM applications;

-- Grant access to the view
GRANT SELECT ON admin_dashboard_stats TO anon, authenticated;

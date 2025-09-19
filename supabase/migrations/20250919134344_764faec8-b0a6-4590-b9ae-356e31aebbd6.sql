-- First, let's remove the conflicting constraint to allow proper roles
DROP CONSTRAINT IF EXISTS check_valid_roles ON public.users;

-- Insert sample users for testing (using only admin role for now)
INSERT INTO public.users (id, email, name, role, password_hash) VALUES
  ('22222222-2222-2222-2222-222222222222', 'admin@test.com', 'Admin User', 'admin', '$2b$10$example_hash_admin'),  
  ('33333333-3333-3333-3333-333333333333', 'superadmin@test.com', 'Super Admin User', 'admin', '$2b$10$example_hash_superadmin');

-- Insert role assignments to give super admin permissions
INSERT INTO public.role_assignments (user_id, role, department, assigned_by, is_active) VALUES
  ('22222222-2222-2222-2222-222222222222', 'admin', 'Municipal Corporation', '33333333-3333-3333-3333-333333333333', true),
  ('33333333-3333-3333-3333-333333333333', 'super_admin', null, '33333333-3333-3333-3333-333333333333', true);

-- Insert sample admin activities for testing
INSERT INTO public.admin_activities (admin_id, action, details) VALUES
  ('22222222-2222-2222-2222-222222222222', 'user_login', '{"timestamp": "2025-01-15T10:00:00Z"}'),
  ('33333333-3333-3333-3333-333333333333', 'role_assigned', '{"target_user": "admin@test.com", "role": "admin"}');
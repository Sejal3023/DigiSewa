-- Insert sample users for testing with roles from check_valid_roles constraint
INSERT INTO public.users (id, email, name, role, password_hash) VALUES
  ('11111111-1111-1111-1111-111111111111', 'citizen@test.com', 'John Citizen', 'citizen', '$2b$10$example_hash_citizen'),
  ('22222222-2222-2222-2222-222222222222', 'admin@test.com', 'Admin User', 'admin', '$2b$10$example_hash_admin'),  
  ('33333333-3333-3333-3333-333333333333', 'superadmin@test.com', 'Super Admin', 'super_admin', '$2b$10$example_hash_superadmin');

-- Insert role assignments for the test users
INSERT INTO public.role_assignments (user_id, role, department, assigned_by, is_active) VALUES
  ('22222222-2222-2222-2222-222222222222', 'admin', 'Municipal Corporation', '33333333-3333-3333-3333-333333333333', true),
  ('33333333-3333-3333-3333-333333333333', 'super_admin', null, '33333333-3333-3333-3333-333333333333', true);

-- Insert some sample applications for testing
INSERT INTO public.applications (id, user_id, license_type, status, submission_date) VALUES
  ('app-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'shop_establishment', 'pending', now() - interval '2 days'),
  ('app-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'vehicle_registration', 'processing', now() - interval '1 day'),
  ('app-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'food_license', 'approved', now() - interval '5 days');

-- Insert sample approvals
INSERT INTO public.approvals (application_id, approved_by, department_name, approval_date, remarks) VALUES
  ('app-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Municipal Corporation', now() - interval '3 days', 'All documents verified successfully');

-- Insert sample admin activities
INSERT INTO public.admin_activities (admin_id, action, target_application_id, details) VALUES
  ('22222222-2222-2222-2222-222222222222', 'application_approved', 'app-3333-3333-3333-333333333333', '{"remarks": "Documents verified"}'),
  ('33333333-3333-3333-3333-333333333333', 'role_assigned', null, '{"target_user": "admin@test.com", "role": "admin"}');
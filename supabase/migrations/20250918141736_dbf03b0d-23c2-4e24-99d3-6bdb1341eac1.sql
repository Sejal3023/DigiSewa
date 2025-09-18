-- Add foreign key constraint from role_assignments to users table
ALTER TABLE public.role_assignments 
ADD CONSTRAINT fk_role_assignments_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraint for assigned_by field
ALTER TABLE public.role_assignments 
ADD CONSTRAINT fk_role_assignments_assigned_by 
FOREIGN KEY (assigned_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;
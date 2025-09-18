-- Remove the incorrect foreign keys
ALTER TABLE public.role_assignments DROP CONSTRAINT IF EXISTS fk_role_assignments_user_id;
ALTER TABLE public.role_assignments DROP CONSTRAINT IF EXISTS fk_role_assignments_assigned_by;

-- Add correct foreign key constraints referencing public.users table
ALTER TABLE public.role_assignments 
ADD CONSTRAINT fk_role_assignments_user_id 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.role_assignments 
ADD CONSTRAINT fk_role_assignments_assigned_by 
FOREIGN KEY (assigned_by) 
REFERENCES public.users(id) 
ON DELETE SET NULL;
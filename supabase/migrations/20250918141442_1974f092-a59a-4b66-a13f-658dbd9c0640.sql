-- Update user roles to include Super Admin and additional admin roles
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ADD CONSTRAINT check_valid_roles 
  CHECK (role IN ('citizen', 'admin', 'super_admin', 'department_head', 'officer', 'staff'));

-- Create role assignments table for better role management
CREATE TABLE public.role_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin', 'department_head', 'officer', 'staff')),
  department TEXT,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for role_assignments
CREATE POLICY "Super Admin can manage all role assignments" 
ON public.role_assignments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() AND u.role = 'super_admin'
));

CREATE POLICY "Users can view their own role assignments" 
ON public.role_assignments 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view role assignments in their department" 
ON public.role_assignments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.role IN ('admin', 'department_head') 
  AND (department IS NULL OR department = (SELECT department FROM role_assignments ra2 WHERE ra2.user_id = auth.uid() LIMIT 1))
));

-- Create activity monitoring table for Super Admin
CREATE TABLE public.admin_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_application_id UUID,
  department TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_activities
CREATE POLICY "Super Admin can view all activities" 
ON public.admin_activities 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() AND u.role = 'super_admin'
));

CREATE POLICY "Admins can insert their own activities" 
ON public.admin_activities 
FOR INSERT 
WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can view their own activities" 
ON public.admin_activities 
FOR SELECT 
USING (admin_id = auth.uid());

-- Function to automatically log admin activities
CREATE OR REPLACE FUNCTION public.log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log application status changes
  IF TG_TABLE_NAME = 'applications' AND OLD.status != NEW.status THEN
    INSERT INTO public.admin_activities (admin_id, action, target_application_id, details)
    VALUES (auth.uid(), 'application_status_changed', NEW.id, 
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  
  -- Log approval actions
  IF TG_TABLE_NAME = 'approvals' THEN
    INSERT INTO public.admin_activities (admin_id, action, target_application_id, department, details)
    VALUES (NEW.approved_by, 'approval_processed', NEW.application_id, NEW.department_name,
            jsonb_build_object('remarks', NEW.remarks));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for activity logging
CREATE TRIGGER log_application_changes
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();

CREATE TRIGGER log_approval_actions
  AFTER INSERT ON public.approvals
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();

-- Update existing users table policies to include super_admin
DROP POLICY IF EXISTS "Admins can view all" ON public.users;
CREATE POLICY "Super Admin and Admins can view all" 
ON public.users 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on role_assignments
CREATE TRIGGER update_role_assignments_updated_at
  BEFORE UPDATE ON public.role_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
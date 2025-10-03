import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export type UserRole = 'citizen' | 'department' | 'admin' | 'super_admin';

interface UseAdminRoleReturn {
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDepartment: boolean;
}

export function useAdminRole(): UseAdminRoleReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('role', { ascending: true })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          toast({
            title: "Access Error",
            description: "Unable to verify your permissions.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        const userRole = data?.role as UserRole;
        setRole(userRole);

        // Check if user has admin access
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges.",
            variant: "destructive"
          });
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user, navigate, toast]);

  return {
    role,
    loading,
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
    isDepartment: role === 'department'
  };
}

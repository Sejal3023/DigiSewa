import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function DepartmentLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserRoleAndRedirect();
    }
  }, [user]);

  const checkUserRoleAndRedirect = async () => {
    if (!user) return;
    
    const role = await authService.getUserRole(user.id);
    if (role?.role === 'department') {
      navigate('/department-dashboard');
    } else if (role?.role === 'admin' || role?.role === 'super_admin') {
      navigate('/admin-dashboard');
    } else {
      toast({
        title: "Access Denied",
        description: "You don't have department access privileges.",
        variant: "destructive"
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        const role = await authService.getUserRole(data.user.id);
        
        if (role?.role === 'department') {
          toast({
            title: "Login Successful",
            description: `Welcome back, ${role.department || 'Department'} Officer!`
          });
          navigate('/department-dashboard');
        } else if (role?.role === 'admin' || role?.role === 'super_admin') {
          navigate('/admin-dashboard');
        } else {
          await supabase.auth.signOut();
          throw new Error('You do not have department access');
        }
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Department Login</CardTitle>
            <CardDescription>
              Sign in to access your department dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="department@gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>Not a department user?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate('/login')}
                  >
                    Citizen Login
                  </Button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

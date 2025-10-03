import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Wallet, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserRoleAndRedirect();
    }
  }, [user]);

  const checkUserRoleAndRedirect = async () => {
    if (!user) return;
    
    const role = await authService.getUserRole(user.id);
    if (role?.role === 'admin' || role?.role === 'super_admin') {
      navigate('/admin-dashboard');
    } else {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive"
      });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
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
        if (role?.role === 'admin' || role?.role === 'super_admin') {
          toast({
            title: "Login Successful",
            description: "Welcome back, Admin!"
          });
          navigate('/admin-dashboard');
        } else {
          await supabase.auth.signOut();
          throw new Error('You do not have admin access');
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

  const handleMetaMaskLogin = async () => {
    setWalletLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const walletAddress = accounts[0];
      
      // Check if this wallet is linked to an admin account
      const { data: walletData, error: walletError } = await supabase
        .from('wallet_connections')
        .select('user_id')
        .eq('wallet_address', walletAddress)
        .eq('is_active', true)
        .single();

      if (walletError || !walletData) {
        throw new Error('This wallet is not linked to an admin account. Please login with email first and connect your wallet.');
      }

      // Check if user has admin role
      const role = await authService.getUserRole(walletData.user_id);
      if (!role || (role.role !== 'admin' && role.role !== 'super_admin')) {
        throw new Error('This account does not have admin privileges.');
      }

      toast({
        title: "Wallet Connected",
        description: "Successfully authenticated with MetaMask",
      });

      // In a real implementation, you would create a session here
      // For now, we'll redirect to admin dashboard
      navigate('/admin-dashboard');

    } catch (error: any) {
      toast({
        title: "MetaMask Login Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setWalletLoading(false);
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
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>
              Sign in to access the admin dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email/Password Login */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
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
                {loading ? 'Signing in...' : 'Sign In with Email'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* MetaMask Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleMetaMaskLogin}
              disabled={walletLoading}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {walletLoading ? 'Connecting...' : 'Connect with MetaMask'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Not an admin?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => navigate('/login')}
                >
                  Citizen Login
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

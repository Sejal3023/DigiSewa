import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Mail, Lock, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/config/api";

const Login = () => {
  const [userForm, setUserForm] = useState({
    email: "",
    password: ""
  });

  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
    adminCode: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result: any = await signIn(userForm.email, userForm.password);

      // If signIn returns an object with a token, store it; if it returns true, just navigate.
      if (result && typeof result === "object" && "token" in result && result.token) {
        localStorage.setItem('auth_token', result.token);
        navigate("/dashboard");
      } else if (result === true) {
        navigate("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  // ✅ ADD FRONTEND VALIDATION
  if (!adminForm.email || !adminForm.password || !adminForm.adminCode) {
    toast({
      title: "Missing Fields",
      description: "Please fill in all required fields",
      variant: "destructive",
    });
    return;
  }

  if (adminForm.password.length < 8) {
    toast({
      title: "Invalid Password",
      description: "Password must be at least 8 characters long",
      variant: "destructive",
    });
    return;
  }

  setIsLoading(true);

  try {
    // Call backend admin authentication
    const response = await fetch(getApiUrl('/admin/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: adminForm.email.trim(), // ✅ TRIM EMAIL
        password: adminForm.password,
        adminCode: adminForm.adminCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // ✅ IMPROVED ERROR HANDLING
      let errorMessage = data.error || "Authentication failed";

      // Handle specific error cases
      if (errorMessage.includes('password') || errorMessage.includes('credentials')) {
        errorMessage = "Invalid email or password";
      } else if (errorMessage.includes('access code')) {
        errorMessage = "Invalid or expired admin access code";
      } else if (errorMessage.includes('System error')) {
        errorMessage = "System configuration error - please contact administrator";
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      // ✅ SUCCESS HANDLING
      const userData = data.user || data.admin;

      if (data.admin) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminInfo', JSON.stringify(data.admin));
      } else if (data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      toast({
        title: "Login Successful",
        description: `Welcome, ${userData.fullName || userData.full_name}!`,
      });

      // Redirect logic
      if (userData.role === 'officer' && userData.department) {
        const departmentRoutes: Record<string, string> = {
          'Food Safety Department': '/departments/food-safety',
          'Labour Department': '/departments/labour',
          'Regional Transport Office': '/departments/rto',
          'Police Department': '/departments/police',
          'Revenue Department': '/departments/revenue',
          'Municipal Corporation': '/departments/municipal'
        };

        const route = departmentRoutes[userData.department];
        navigate(route || '/dashboard');
      } else {
        navigate("/admin/admin-dashboard");
      }
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    toast({
      title: "Network Error",
      description: "Unable to connect to server. Please check your connection.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Access Portal
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your access level to continue to the digital government services platform
            </p>
          </div>

          {/* Login Tabs */}
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Citizen Login
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Portal
              </TabsTrigger>
            </TabsList>

            {/* User Login Section */}
            <TabsContent value="user">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">
                      Citizen Access
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Access government services, track applications, and manage your digital certificates.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Apply for licenses and permits
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Track application status
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Download digital certificates
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Secure blockchain verification
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="shadow-corporate">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Citizen Login
                    </CardTitle>
                    <CardDescription>
                      Enter your credentials to access government services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUserLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="user-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="user-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="user-password"
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Login to Services"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>

                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Don't have an account?
                      </p>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/register">
                          Register here
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Admin Login Section */}
            <TabsContent value="admin">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">
                      Administrative Portal
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Secure access for government officials and administrators to manage the platform.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        Manage user applications
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        Issue digital certificates
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        Monitor blockchain transactions
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        System administration
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="shadow-corporate border-accent/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-accent" />
                      Admin Portal
                    </CardTitle>
                    <CardDescription>
                      Authorized personnel only - Enhanced security required
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Official Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="admin-email"
                            type="email"
                            placeholder="admin@government.in"
                            className="pl-10"
                            value={adminForm.email}
                            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="admin-password"
                            type="password"
                            placeholder="Enter secure password"
                            className="pl-10"
                            value={adminForm.password}
                            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-code">Admin Access Code</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="admin-code"
                            type="password"
                            placeholder="Enter authorization code"
                            className="pl-10"
                            value={adminForm.adminCode}
                            onChange={(e) => setAdminForm({ ...adminForm, adminCode: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                        {isLoading ? "Verifying..." : "Access Admin Portal"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>

                    <div className="mt-6 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground text-center">
                        ⚠️ This portal is for authorized government personnel only. 
                        Unauthorized access attempts are logged and monitored.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Additional Information */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact our support team at{" "}
              <a href="mailto:support@digitalindia.gov.in" className="text-primary hover:underline">
                support@digitalindia.gov.in
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;

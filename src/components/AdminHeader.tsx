import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminHeaderProps {
  adminInfo: {
    fullName: string;
    role: string;
    department: string;
  };
}

const AdminHeader = ({ adminInfo }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    navigate("/admin/login");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'officer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">DigiSewa Admin</h1>
              <p className="text-xs text-muted-foreground">Super Admin Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/admin/dashboard' || location.pathname === '/admin/admin-dashboard'
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/admin/applications')}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname.startsWith('/admin/applications') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/admin/users' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => navigate('/admin/audit')}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/admin/audit' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Audit Trail
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/admin/analytics' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Analytics
            </button>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{adminInfo.fullName}</p>
              <div className="flex items-center gap-2 justify-end">
                <Badge variant={getRoleBadgeVariant(adminInfo.role)} className="text-xs">
                  {adminInfo.role.replace('_', ' ').toUpperCase()}
                </Badge>
                {adminInfo.department && (
                  <Badge variant="outline" className="text-xs">
                    {adminInfo.department}
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminHeader;

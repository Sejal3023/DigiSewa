import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Users, 
  Settings, 
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminNavigationProps {
  userRole: string;
  userDepartment: string;
}

const AdminNavigation = ({ userRole, userDepartment }: AdminNavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/admin/admin-dashboard",
      icon: LayoutDashboard,
      description: "Overview and statistics"
    },
    {
      name: "Review Applications",
      href: "/admin/applications",
      icon: FileText,
      description: "Process pending applications"
    },
    {
      name: "Manage Users",
      href: "/admin/users",
      icon: Users,
      description: "User management and roles",
      requiresPermission: userRole === 'super_admin'
    },
    {
      name: "System Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Configure system parameters",
      requiresPermission: userRole === 'super_admin'
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    navigate("/login");
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-1">
        {navigationItems.map((item) => {
          if (item.requiresPermission === false) return null;
          
          const Icon = item.icon;
          return (
            <Button
              key={item.name}
              variant={isActiveRoute(item.href) ? "default" : "ghost"}
              onClick={() => navigate(item.href)}
              className="flex items-center gap-2 px-4 py-2"
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Button>
          );
        })}
        
        <div className="ml-4 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{userRole.replace('_', ' ').toUpperCase()}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/20" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-background border-l shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Admin Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 p-4 space-y-2">
                  {navigationItems.map((item) => {
                    if (item.requiresPermission === false) return null;
                    
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.name}
                        variant={isActiveRoute(item.href) ? "default" : "ghost"}
                        onClick={() => {
                          navigate(item.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start h-auto p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>

                <div className="p-4 border-t space-y-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{userRole.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground px-3">
                    {userDepartment}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminNavigation;

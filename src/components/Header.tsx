import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Menu, User, Bell, LogOut, Settings, UserCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import governmentLogo from "@/assets/government-logo.png";

interface HeaderProps {
  isAuthenticated?: boolean;
  userRole?: 'citizen' | 'officer' | 'admin';
}

export const Header = ({ isAuthenticated = false, userRole = 'citizen' }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Logout Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/applications", label: "My Applications" },
    { href: "/track", label: "Track Application" },
    { href: "/help", label: "Help & Support" },
  ];

  const adminNavItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/departments", label: "Departments" },
    { href: "/admin/officers", label: "Officers" },
    { href: "/admin/analytics", label: "Analytics" },
  ];

  const officerNavItems = [
    { href: "/officer", label: "Dashboard" },
    { href: "/officer/applications", label: "Applications" },
    { href: "/officer/approvals", label: "Approvals" },
  ];

  const currentNavItems = userRole === 'admin' ? adminNavItems : 
                          userRole === 'officer' ? officerNavItems : navItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo and Title */}
        <Link to="/" className="flex items-center space-x-3">
          <img src={governmentLogo} alt="Government Logo" className="h-10 w-10" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary">Government of India</span>
            <span className="text-xs text-muted-foreground">Blockchain License System</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 ml-8">
          {currentNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === item.href 
                  ? "text-primary border-b-2 border-primary pb-1" 
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" className="relative hover:bg-muted">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">2</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-muted">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="hover:bg-muted">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-muted">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="government" size="sm" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-6">
                {currentNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === item.href ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
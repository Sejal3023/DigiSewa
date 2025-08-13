import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Menu, User, Bell, LogOut, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import governmentLogo from "@/assets/government-logo.png";

interface HeaderProps {
  isAuthenticated?: boolean;
  userRole?: 'citizen' | 'officer' | 'admin';
}

export const Header = ({ isAuthenticated = false, userRole = 'citizen' }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

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
          {isAuthenticated || user ? (
            <>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      await signOut();
                      navigate('/');
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut, User, Building2, Clock } from 'lucide-react';

interface Officer {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  badge_number?: string;
}

export const DepartmentHeader = () => {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    // Get officer data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setOfficer(JSON.parse(userData));
    }

    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  return (
<header className="bg-background border-b border-border shadow-sm">
  <div className="container mx-auto px-4">
    {/* Top Bar */}
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <img
          src="/emblem.png"
          alt="Government of India"
          className="h-12 w-12"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div>
          <h1 className="text-2xl font-extrabold text-primary">DigiSewa Portal</h1>
          <p className="text-sm text-muted-foreground">
            Government of India | Digital Services Platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground select-none">
        <div className="text-right">
          <p className="font-semibold">{currentTime.toLocaleDateString()}</p>
          <p>{currentTime.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>

   {/* Officer Info Bar */}
{officer && (
  <div className="flex items-center justify-between py-4 border-t border-border">
    <div className="flex items-center gap-6 bg-primary/20 p-3 rounded-lg">
      {/* Officer Details */}
      <div className="flex items-center gap-3">
        <div className="bg-primary p-3 rounded-full">
          <User className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="font-semibold text-lg text-foreground">{officer.full_name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3 text-primary" />
            {officer.badge_number || 'Officer'}
          </p>
        </div>
      </div>

      <div className="h-12 w-px bg-border"></div>

      {/* Department Badge */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="h-5 w-5 text-accent" />
        <div>
          <p className="text-xs">Department</p>
          <p className="font-semibold text-foreground">{officer.department}</p>
        </div>
      </div>
    </div>

    {/* Logout Button */}
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  </div>
)}
  </div>
</header>

  );
};

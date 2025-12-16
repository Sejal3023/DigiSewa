import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminHeader from "@/components/AdminHeader";
//import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Users, 
  FileText, 
  Shield, 
  Settings, 
  LogOut, 
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Activity,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  BarChart3,
  UserCog
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  permissions: Record<string, boolean>;
}

interface Application {
  id: string;
  userid: string;
  licensetype: string;
  status: string;
  submissiondate: string;
  blockchaintxhash: string;
  ipfshash: string;
  applicationdata: any;
  createdat: string;
  updatedat: string;
  currentstage: string;
  responsible_dept: string;
  applicant_name?: string;
  applicant_email?: string;
}

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  processingApplications: number;
  todayApplications: number;
  totalUsers: number;
  totalAdmins: number;
 departmentStats: Array<{
  department: string;
  department_name: string;
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}>;

  recentActivity: Array<{
    action: string;
    timestamp: string;
    user: string;
    details: string;
  }>;
}

interface Department {
  id: string;
  name: string;
}

const AdminDashboard = () => {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    processingApplications: 0,
    todayApplications: 0,
    totalUsers: 0,
    totalAdmins: 0,
    departmentStats: [],
    recentActivity: []
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdminInfo = localStorage.getItem('adminInfo');

    if (!token || !storedAdminInfo) {
      toast({
        title: "Access Denied",
        description: "Please login to access admin portal",
        variant: "destructive",
      });
      navigate("/admin/login");
      return;
    }

    try {
      const admin = JSON.parse(storedAdminInfo);
      setAdminInfo(admin);
      fetchDashboardData(token);
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => fetchDashboardData(token), 30000);
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error parsing admin info:', error);
      handleLogout();
    }
  }, [navigate, toast]);

  useEffect(() => {
    // Apply filters
    let filtered = recentApplications;

    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.licensetype.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(app => app.responsible_dept === departmentFilter);
    }

    setFilteredApplications(filtered);
  }, [searchQuery, statusFilter, departmentFilter, recentApplications]);

  const fetchDashboardData = async (token: string) => {
    try {
      // Fetch all departments
      const departmentsResponse = await fetch(`${API_URL}/admin/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (departmentsResponse.ok) {
        const departmentsData = await departmentsResponse.json();
        setDepartments(departmentsData.departments || []);
      }

      // Fetch comprehensive dashboard stats
      const statsResponse = await fetch(`${API_URL}/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 FRONTEND RECEIVED:', JSON.stringify(statsData.departmentStats, null, 2));
        setStats(statsData);
      } else if (statsResponse.status === 401) {
        handleLogout();
        return;
      }

      // Fetch recent applications with full details
      const applicationsResponse = await fetch(`${API_URL}/admin/applications/recent?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setRecentApplications(applicationsData.applications || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'processing':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/export/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications_export_${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: "Applications data exported successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!adminInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
<AdminHeader adminInfo={adminInfo} />

      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Super Admin Dashboard
              </h1>
              <p className="text-xl text-muted-foreground">
                Welcome back, {adminInfo.fullName}
              </p>
            </div>
            <div className="flex items-center gap-4">
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.todayApplications} today
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedApplications}</div>
              <p className="text-xs text-muted-foreground">
                Successfully processed
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejectedApplications}</div>
              <p className="text-xs text-muted-foreground">
                Declined applications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
 onClick={() => navigate("/admin/applications")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Review Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="sm">
                View All Applications
              </Button>
            </CardContent>
          </Card>

          {adminInfo.permissions?.users && (
            <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
 onClick={() => navigate("/admin/users")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="sm">
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
 onClick={() => navigate("/admin/audit")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="sm">
                View Blockchain Logs
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
 onClick={() => navigate("/admin/analytics")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="sm">
                View Reports
              </Button>
            </CardContent>
          </Card>


        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Applications
              </span>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, name, or license type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Applications ({filteredApplications.length})</span>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/applications")}>
                View All
              </Button>
            </CardTitle>
            <CardDescription>
              Latest applications requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredApplications.length > 0 ? (
              <div className="space-y-4">
                {filteredApplications.slice(0, 10).map((app: Application) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">

                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(app.status)}
                      <div className="flex-1">
                        <p className="font-medium">{app.licensetype}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {app.id.substring(0, 8)}... • 
                          {app.applicant_name || 'N/A'} • 
                          {new Date(app.submissiondate).toLocaleDateString()}
                        </p>
                        {app.blockchaintxhash && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Shield className="inline h-3 w-3 mr-1" />
                            Blockchain: {app.blockchaintxhash.substring(0, 16)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/admin/applications/${app.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No applications found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Performance */}
        {departments.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Department Performance
              </CardTitle>
              <CardDescription>
                Overview of application processing across all departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => {
                  // Find stats for this department
                  const deptStats = stats.departmentStats.find(stat => stat.department === dept.id) || {
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    total: 0
                  };

                  return (
                    <Card key={dept.id} className="bg-gray-50 dark:bg-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{dept.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pending:</span>
                            <span className="font-medium text-yellow-600">{deptStats.pending}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Approved:</span>
                            <span className="font-medium text-green-600">{deptStats.approved}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rejected:</span>
                            <span className="font-medium text-red-600">{deptStats.rejected}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-medium">{deptStats.total}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;

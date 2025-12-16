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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminHeader from "@/components/AdminHeader";
import { Footer } from "@/components/Footer";
import { 
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  ArrowUpDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  license_type: string;
  status: string;
  submission_date: string;
  blockchain_tx_hash: string;
  applicant_name: string;
  applicant_email: string;
  responsible_dept: string;
  department_id?: string;
  department_name?: string;
}


const ApplicationsList = () => {
  // ✅ ADD adminInfo state
  const [adminInfo, setAdminInfo] = useState<{
    fullName: string;
    role: string;
    department: string;
  } | null>(null);

  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("submissiondate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [departmentFilter, setDepartmentFilter] = useState("all");
const [departments, setDepartments] = useState<Array<{
  id: string;
  name: string;
}>>([]);

  
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

  // ✅ Load admin info on mount
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
    } catch (error) {
      console.error('Error parsing admin info:', error);
      navigate('/admin/login');
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (adminInfo) {
      fetchApplications();
      fetchDepartments();
    }
  }, [adminInfo]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter,departmentFilter, applications, sortField, sortDirection]);

  // Debug logs
  useEffect(() => {
    console.log('🔍 DEBUG - Department Filtering:');
    console.log('Department Filter Value:', departmentFilter);
    console.log('All Departments:', departments);
    console.log('Applications with departments:', applications.map(app => ({
      id: app.id,
      responsible_dept: app.responsible_dept,
      department_name: app.department_name
    })));
  }, [departmentFilter, departments, applications]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await fetch(`${API_URL}/admin/applications/recent?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Applications received:', data.applications); // Debug log
        setApplications(data.applications || []);
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const fetchDepartments = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    console.log('🔍 Fetching departments from:', `${API_URL}/admin/departments`);
    const response = await fetch(`${API_URL}/admin/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DEPARTMENTS RECEIVED:', data.departments);
      setDepartments(data.departments || []);
    } else {
      console.error('❌ Failed to fetch departments:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
  }
};


  const applyFilters = () => {
    let filtered = [...applications];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.license_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Department filter - Direct UUID comparison
    if (departmentFilter !== "all") {
      filtered = filtered.filter(app => app.responsible_dept === departmentFilter);
    }

    // Sort (only once)
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Application];
      const bValue = b[sortField as keyof Application];

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredApps(filtered);
  };


  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      processing: "outline",
      department_approved: "secondary"
    };
    return variants[status] || "outline";
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
        return null;
    }
  };

  const handleExport = async () => {
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
        a.download = `applications_${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: "Applications exported to CSV",
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

  // ✅ Check for both isLoading and adminInfo
  if (isLoading || !adminInfo) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AdminHeader adminInfo={adminInfo} />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Applications Management
          </h1>
          <p className="text-xl text-muted-foreground">
            Review and manage all license applications
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </span>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
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
                  <SelectItem value="department_approved">Awaiting Super Admin</SelectItem>
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

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApps.length})</CardTitle>
            <CardDescription>
              All license applications with current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">
                      <Button variant="ghost" size="sm" onClick={() => handleSort("id")}>
                        ID <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort("licensetype")}>
                        License Type <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort("submissiondate")}>
                        Submitted <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.length > 0 ? (
                    filteredApps.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-sm">
                          {app.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium">{app.license_type}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.applicant_name}</p>
                            <p className="text-sm text-muted-foreground">{app.applicant_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(app.submission_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(app.status)}
                            <Badge variant={getStatusBadge(app.status)}>
                              {app.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/admin/applications/${app.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No applications found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ApplicationsList;

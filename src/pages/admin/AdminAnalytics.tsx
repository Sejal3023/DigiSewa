import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminHeader from "@/components/AdminHeader";
import { Footer } from "@/components/Footer";
import { 
  BarChart3,
  TrendingUp,
  ArrowLeft,
  Users,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  totalUsers: number;
  totalApplications: number;
  successRate: number;
  avgProcessingTime: number;
  monthlyData: Array<{
    month: string;
    applications: number;
    approved: number;
    rejected: number;
  }>;
  departmentData: Array<{
    department: string;
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    avgTime: string | number;
  }>;
  dailyStats: Array<{
    date: string;
    applications: number;
  }>;
}

const AdminAnalytics = () => {
  const [adminInfo, setAdminInfo] = useState<{
    fullName: string;
    role: string;
    department: string;
  } | null>(null);
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
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
    } catch (error) {
      console.error('Error parsing admin info:', error);
      navigate('/admin/login');
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (adminInfo) {
      fetchAnalytics();
    }
  }, [timeRange, adminInfo]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await fetch(`${API_URL}/admin/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    toast({
      title: "Exporting Report",
      description: "Analytics report will be downloaded shortly",
    });
  };

  if (isLoading || !adminInfo) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AdminHeader adminInfo={adminInfo} />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <BarChart3 className="h-10 w-10 text-primary" />
                Analytics & Reports
              </h1>
              <p className="text-xl text-muted-foreground">
                System performance and application statistics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAnalytics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportReport} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered citizens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalApplications.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.successRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Approval rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgProcessingTime} days</div>
              <p className="text-xs text-muted-foreground mt-1">
                Time to decision
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Application Trends</CardTitle>
            <CardDescription>
              Application submissions over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.monthlyData.length > 0 ? (
              <div className="space-y-4">
                {analytics.monthlyData.map((month, index) => {
                  const total = month.applications;
                  const approvedPercent = total > 0 ? (month.approved / total) * 100 : 0;
                  const rejectedPercent = total > 0 ? (month.rejected / total) * 100 : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.month}</span>
                        <span className="text-muted-foreground">{total} applications</span>
                      </div>
                      {total > 0 && (
                        <>
                          <div className="flex h-8 rounded-full overflow-hidden">
                            <div 
                              className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                              style={{ width: `${approvedPercent}%` }}
                            >
                              {month.approved > 0 && `${month.approved}`}
                            </div>
                            <div 
                              className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                              style={{ width: `${rejectedPercent}%` }}
                            >
                              {month.rejected > 0 && `${month.rejected}`}
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              Approved: {month.approved}
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              Rejected: {month.rejected}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No monthly data available</p>
            )}
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>
              Application processing statistics by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.departmentData.length > 0 ? (
              <div className="space-y-6">
                {analytics.departmentData.map((dept, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{dept.department}</h4>
                      <Badge variant="outline">{dept.total} total</Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <Clock className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
                        <p className="font-bold text-yellow-600">{dept.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-600" />
                        <p className="font-bold text-green-600">{dept.approved}</p>
                        <p className="text-xs text-muted-foreground">Approved</p>
                      </div>
                      <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <XCircle className="h-4 w-4 mx-auto mb-1 text-red-600" />
                        <p className="font-bold text-red-600">{dept.rejected}</p>
                        <p className="text-xs text-muted-foreground">Rejected</p>
                      </div>
                      <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Activity className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                        <p className="font-bold text-blue-600">{dept.avgTime}d</p>
                        <p className="text-xs text-muted-foreground">Avg Time</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No department data available</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>
              Daily application submissions this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyStats.length > 0 ? (
              <div className="flex items-end justify-between gap-2 h-64">
                {analytics.dailyStats.map((day, index) => {
                  const maxApplications = Math.max(...analytics.dailyStats.map(d => d.applications), 1);
                  const heightPercent = (day.applications / maxApplications) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {day.applications}
                      </div>
                      <div 
                        className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80"
                        style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                      ></div>
                      <div className="text-xs font-medium">{day.date}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No weekly data available</p>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AdminAnalytics;

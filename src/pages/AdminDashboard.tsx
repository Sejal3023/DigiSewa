import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download,
  Search,
  Filter,
  Users,
  BarChart3,
  Settings,
  Shield,
  CheckSquare,
  XSquare,
  Building2,
  Calendar,
  TrendingUp,
  FileCheck,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Activity,
  Crown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import WalletConnect from "@/components/WalletConnect";
import RoleManagement from "@/components/RoleManagement";
import ActivityMonitor from "@/components/ActivityMonitor";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    approvedToday: 0,
    rejectedApplications: 0,
    processingApplications: 0
  });
  const [departments] = useState([
    "Municipal Corporation",
    "RTO",
    "Food & Drug Administration", 
    "Police Department",
    "Public Works Department",
    "Revenue Department",
    "Education Department",
    "Health Department"
  ]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check if user has Super Admin privileges
  const isSuperAdmin = user?.email && (
    user.email === 'super.admin@gov.in' || 
    // Add check for super_admin role from database
    false // This will be updated when user role is loaded from DB
  );

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select(`
          *,
          users!applications_user_id_fkey(name, email),
          documents(id, doc_type, file_url),
          approvals(department_name, remarks, approval_date, approved_by)
        `)
        .order('submission_date', { ascending: false });

      if (error) throw error;

      const formattedApplications = applicationsData?.map(app => ({
        id: app.id,
        user_name: app.users?.name || 'Unknown User',
        user_email: app.users?.email || 'No email',
        license_type: app.license_type,
        status: app.status,
        submission_date: app.submission_date,
        documents: app.documents || [],
        approvals: app.approvals || [],
        blockchain_tx_hash: app.blockchain_tx_hash,
        ipfs_hash: app.ipfs_hash
      })) || [];

      setApplications(formattedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: totalApps } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      const { count: pendingApps } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approvedToday } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('submission_date', new Date().toISOString().split('T')[0]);

      const { count: rejectedApps } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      const { count: processingApps } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'processing');

      setStats({
        totalApplications: totalApps || 0,
        pendingReview: pendingApps || 0,
        approvedToday: approvedToday || 0,
        rejectedApplications: rejectedApps || 0,
        processingApplications: processingApps || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  const adminStats = [
    { label: "Total Applications", value: stats.totalApplications.toString(), icon: FileText, color: "text-primary" },
    { label: "Pending Review", value: stats.pendingReview.toString(), icon: Clock, color: "text-warning" },
    { label: "Approved Today", value: stats.approvedToday.toString(), icon: CheckCircle2, color: "text-success" },
    { label: "Processing", value: stats.processingApplications.toString(), icon: RefreshCw, color: "text-accent" },
    { label: "Rejected", value: stats.rejectedApplications.toString(), icon: XSquare, color: "text-destructive" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case "processing": 
        return <Badge className="bg-warning text-warning-foreground">Processing</Badge>;
      case "pending":
        return <Badge className="bg-muted text-muted-foreground">Pending Review</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    if (!approvalRemarks.trim()) {
      toast({
        title: "Approval Remarks Required",
        description: "Please provide approval remarks.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Insert approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          application_id: applicationId,
          approved_by: user?.id,
          department_name: departmentFilter !== 'all' ? departmentFilter : 'Admin',
          remarks: approvalRemarks
        });

      if (approvalError) throw approvalError;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action: 'application_approved',
          details: { application_id: applicationId, remarks: approvalRemarks }
        });

      await fetchApplications();
      await fetchStats();
      setApprovalRemarks("");
      setSelectedApplication(null);
      
      toast({
        title: "Application Approved",
        description: `Application ${applicationId} has been approved successfully.`,
      });
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    if (!approvalRemarks.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Insert approval record (rejection)
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          application_id: applicationId,
          approved_by: user?.id,
          department_name: departmentFilter !== 'all' ? departmentFilter : 'Admin',
          remarks: approvalRemarks
        });

      if (approvalError) throw approvalError;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action: 'application_rejected',
          details: { application_id: applicationId, remarks: approvalRemarks }
        });

      await fetchApplications();
      await fetchStats();
      setApprovalRemarks("");
      setSelectedApplication(null);
      
      toast({
        title: "Application Rejected",
        description: `Application ${applicationId} has been rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Error", 
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetProcessing = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'processing' })
        .eq('id', applicationId);

      if (error) throw error;

      await fetchApplications();
      await fetchStats();
      
      toast({
        title: "Status Updated",
        description: `Application ${applicationId} is now being processed.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.license_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} userRole="admin" />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Government Portal Header */}
          <div className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-4xl font-bold text-primary">Government Administration Portal</h1>
                <p className="text-xl text-muted-foreground">
                  {isSuperAdmin ? "Super Administrator Dashboard" : "Central Authority Dashboard"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Multi-Department Access</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span>Administrator: {user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {adminStats.map((stat, index) => (
              <Card key={stat.label} className="animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="roles">Role Management</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="monitor">Activity Monitor</TabsTrigger>}
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      Priority Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {applications.slice(0, 5).map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{app.license_type}</p>
                            <p className="text-sm text-muted-foreground">{app.user_name}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(app.status)}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(app.submission_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-accent" />
                      Department Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {departments.slice(0, 6).map((dept) => (
                        <div key={dept} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">{dept}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Active</Badge>
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(Math.random() * 20 + 5)} pending
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="applications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Application Management System</span>
                    <div className="flex items-center space-x-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-60"
                      />
                      <Button variant="outline" size="sm" onClick={() => { fetchApplications(); fetchStats(); }}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading applications...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applicant</TableHead>
                          <TableHead>License Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submission Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{app.user_name}</p>
                                <p className="text-sm text-muted-foreground">{app.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{app.license_type}</TableCell>
                            <TableCell>{getStatusBadge(app.status)}</TableCell>
                            <TableCell>{new Date(app.submission_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedApplication(app)}>
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Application Details</DialogTitle>
                                    </DialogHeader>
                                    {selectedApplication && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Applicant Name</Label>
                                            <p className="font-medium">{selectedApplication.user_name}</p>
                                          </div>
                                          <div>
                                            <Label>License Type</Label>
                                            <p className="font-medium">{selectedApplication.license_type}</p>
                                          </div>
                                          <div>
                                            <Label>Status</Label>
                                            {getStatusBadge(selectedApplication.status)}
                                          </div>
                                          <div>
                                            <Label>Submission Date</Label>
                                            <p>{new Date(selectedApplication.submission_date).toLocaleDateString()}</p>
                                          </div>
                                        </div>
                                        
                                        {selectedApplication.status === 'pending' && (
                                          <div className="space-y-4 pt-4 border-t">
                                            <div>
                                              <Label htmlFor="remarks">Approval/Rejection Remarks</Label>
                                              <Textarea
                                                id="remarks"
                                                placeholder="Enter your remarks..."
                                                value={approvalRemarks}
                                                onChange={(e) => setApprovalRemarks(e.target.value)}
                                              />
                                            </div>
                                            <div className="flex gap-2">
                                              <Button 
                                                onClick={() => handleApproveApplication(selectedApplication.id)}
                                                className="bg-success hover:bg-success/90"
                                              >
                                                <CheckSquare className="h-4 w-4 mr-2" />
                                                Approve
                                              </Button>
                                              <Button 
                                                variant="destructive"
                                                onClick={() => handleRejectApplication(selectedApplication.id)}
                                              >
                                                <XSquare className="h-4 w-4 mr-2" />
                                                Reject
                                              </Button>
                                              <Button 
                                                variant="outline"
                                                onClick={() => handleSetProcessing(selectedApplication.id)}
                                              >
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Set Processing
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Department Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Multi-Department Administration</h3>
                    <p className="text-muted-foreground mb-6">
                      Centralized management and coordination across all government departments
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                      {departments.map((dept, index) => (
                        <div key={dept} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <h4 className="font-semibold">{dept}</h4>
                          <p className="text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 20 + 5)} active applications
                          </p>
                          <Badge variant="outline" className="mt-2">Active</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blockchain" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    Blockchain Integration & MetaMask
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Manage blockchain transactions, digital signatures, and certificate verification
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* MetaMask Wallet Connection */}
                    <div>
                      <WalletConnect />
                    </div>
                    
                    {/* Blockchain Operations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Blockchain Operations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">Certificate Issuance</p>
                              <p className="text-sm text-muted-foreground">Issue blockchain-verified certificates</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <FileCheck className="h-4 w-4 mr-2" />
                              Issue
                            </Button>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">Transaction Verification</p>
                              <p className="text-sm text-muted-foreground">Verify blockchain transactions</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Verify
                            </Button>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">Smart Contract Interaction</p>
                              <p className="text-sm text-muted-foreground">Execute smart contract functions</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Shield className="h-4 w-4 mr-2" />
                              Execute
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Recent Blockchain Transactions */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Recent Blockchain Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No blockchain transactions found</p>
                        <p className="text-sm">Connect MetaMask to start processing blockchain transactions</p>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {isSuperAdmin && (
              <TabsContent value="roles" className="space-y-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="h-8 w-8 text-purple-600" />
                    <div>
                      <h2 className="text-2xl font-bold text-purple-600">Super Admin Panel</h2>
                      <p className="text-muted-foreground">Complete administrative control and user management</p>
                    </div>
                  </div>
                </div>
                <RoleManagement />
              </TabsContent>
            )}

            {isSuperAdmin && (
              <TabsContent value="monitor" className="space-y-6">
                <ActivityMonitor />
              </TabsContent>
            )}

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      System Administration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Email Notifications</span>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Backup Settings</span>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span>Security Policies</span>
                        <Button variant="outline" size="sm">Review</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                      System Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                        <p>Comprehensive system analytics and reporting</p>
                        <p className="text-sm mt-2">Track application processing times, success rates, and system performance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
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
  XSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("applications");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock admin stats - replace with real data
  const adminStats = [
    { label: "Total Applications", value: "156", icon: FileText, color: "text-blue-600" },
    { label: "Pending Review", value: "42", icon: Clock, color: "text-orange-600" },
    { label: "Approved Today", value: "18", icon: CheckCircle2, color: "text-green-600" },
    { label: "Active Users", value: "1,247", icon: Users, color: "text-purple-600" }
  ];

  // Mock applications data - replace with Supabase queries
  const mockApplications = [
    {
      id: "APP001",
      user_name: "Rajesh Kumar",
      user_email: "rajesh@example.com",
      license_type: "Shop & Establishment License",
      status: "pending",
      submission_date: "2024-01-22",
      department: "Municipal Corporation",
      fees: "₹1,500",
      documents: ["identity_proof.pdf", "address_proof.pdf", "shop_agreement.pdf"]
    },
    {
      id: "APP002",
      user_name: "Priya Sharma",
      user_email: "priya@example.com", 
      license_type: "Vehicle Registration",
      status: "pending",
      submission_date: "2024-01-21",
      department: "RTO",
      fees: "₹850",
      documents: ["rc_form.pdf", "insurance.pdf", "pollution_cert.pdf"]
    },
    {
      id: "APP003",
      user_name: "Mohammed Ali",
      user_email: "mohammed@example.com",
      license_type: "FSSAI Food License", 
      status: "processing",
      submission_date: "2024-01-20",
      department: "Food & Drug Administration",
      fees: "₹2,000",
      documents: ["fssai_form.pdf", "premises_proof.pdf", "water_test.pdf"]
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setApplications(mockApplications);
      setLoading(false);
    }, 1000);
  }, []);

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
    try {
      // Update application status to approved
      // In real implementation, use Supabase update
      const updatedApplications = applications.map(app => 
        app.id === applicationId ? { ...app, status: "approved" } : app
      );
      setApplications(updatedApplications);
      
      toast({
        title: "Application Approved",
        description: `Application ${applicationId} has been approved successfully.`,
      });
    } catch (error) {
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
      // Update application status to rejected
      const updatedApplications = applications.map(app => 
        app.id === applicationId ? { ...app, status: "rejected", rejection_reason: approvalRemarks } : app
      );
      setApplications(updatedApplications);
      setApprovalRemarks("");
      
      toast({
        title: "Application Rejected",
        description: `Application ${applicationId} has been rejected.`,
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} userRole="admin" />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Admin Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-accent" />
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage applications, users, and system settings</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {adminStats.map((stat, index) => (
              <Card key={stat.label} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Application Management</span>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4" />
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
                          <TableHead>Application ID</TableHead>
                          <TableHead>Applicant</TableHead>
                          <TableHead>License Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{app.user_name}</div>
                                <div className="text-sm text-muted-foreground">{app.user_email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{app.license_type}</TableCell>
                            <TableCell>{getStatusBadge(app.status)}</TableCell>
                            <TableCell>{new Date(app.submission_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedApplication(app)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {app.status === "pending" && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-success hover:text-success"
                                      onClick={() => handleApproveApplication(app.id)}
                                    >
                                      <CheckSquare className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleRejectApplication(app.id)}
                                    >
                                      <XSquare className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Application Details Modal/Panel */}
              {selectedApplication && (
                <Card>
                  <CardHeader>
                    <CardTitle>Application Details - {selectedApplication.id}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Applicant Name</Label>
                        <p className="font-medium">{selectedApplication.user_name}</p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="font-medium">{selectedApplication.user_email}</p>
                      </div>
                      <div>
                        <Label>License Type</Label>
                        <p className="font-medium">{selectedApplication.license_type}</p>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <p className="font-medium">{selectedApplication.department}</p>
                      </div>
                      <div>
                        <Label>Fees</Label>
                        <p className="font-medium">{selectedApplication.fees}</p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        {getStatusBadge(selectedApplication.status)}
                      </div>
                    </div>

                    <div>
                      <Label>Documents Submitted</Label>
                      <div className="mt-2 space-y-2">
                        {selectedApplication.documents?.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{doc}</span>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedApplication.status === "pending" && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="remarks">Approval/Rejection Remarks</Label>
                          <Textarea
                            id="remarks"
                            placeholder="Enter your remarks..."
                            value={approvalRemarks}
                            onChange={(e) => setApprovalRemarks(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button 
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleApproveApplication(selectedApplication.id)}
                          >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Approve Application
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleRejectApplication(selectedApplication.id)}
                          >
                            <XSquare className="h-4 w-4 mr-2" />
                            Reject Application
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedApplication(null)}
                    >
                      Close Details
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">User Management</h3>
                    <p className="text-muted-foreground">
                      View and manage user accounts, roles, and permissions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                    <p className="text-muted-foreground">
                      View system performance, usage statistics, and insights
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">System Configuration</h3>
                    <p className="text-muted-foreground">
                      Configure system settings, departments, and administrative options
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
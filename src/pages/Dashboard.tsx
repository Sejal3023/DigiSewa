import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download,
  Plus,
  Search,
  Filter,
  Calendar,
  Bell
} from "lucide-react";
import { Link } from "react-router-dom";
import WalletConnect from "@/components/WalletConnect";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("applications");

  const applications = [
    {
      id: "APP001",
      title: "Shop & Establishment License",
      type: "Business License",
      status: "approved",
      submittedDate: "2024-01-15",
      approvedDate: "2024-01-18",
      progress: 100,
      applicationId: "SHE2024001",
      department: "Municipal Corporation",
      fees: "₹1,500",
      validUntil: "2025-01-18"
    },
    {
      id: "APP002", 
      title: "Vehicle Registration",
      type: "Transport",
      status: "processing",
      submittedDate: "2024-01-20",
      progress: 75,
      applicationId: "VEH2024002",
      department: "RTO",
      fees: "₹850",
      estimatedCompletion: "2024-01-25"
    },
    {
      id: "APP003",
      title: "FSSAI Food License",
      type: "Food Safety",
      status: "pending",
      submittedDate: "2024-01-22",
      progress: 25,
      applicationId: "FSS2024003", 
      department: "Food & Drug Administration",
      fees: "₹2,000",
      estimatedCompletion: "2024-01-30"
    },
    {
      id: "APP004",
      title: "Income Certificate", 
      type: "Legal Document",
      status: "rejected",
      submittedDate: "2024-01-10",
      rejectedDate: "2024-01-12",
      progress: 0,
      applicationId: "INC2024004",
      department: "Revenue Department",
      fees: "₹50",
      rejectionReason: "Incomplete address verification documents"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case "processing": 
        return <Badge className="bg-warning text-warning-foreground">Processing</Badge>;
      case "pending":
        return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "processing":
        return <Clock className="h-4 w-4 text-warning" />;
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const stats = [
    { label: "Total Applications", value: "4", icon: FileText, color: "text-blue-600" },
    { label: "Approved", value: "1", icon: CheckCircle2, color: "text-green-600" },
    { label: "Processing", value: "2", icon: Clock, color: "text-orange-600" },
    { label: "Rejected", value: "1", icon: AlertCircle, color: "text-red-600" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} userRole="citizen" />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, Rajesh Kumar</h1>
            <p className="text-muted-foreground">Manage your applications and access government services</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
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

          {/* Wallet Connection */}
          <div className="mb-8">
            <WalletConnect />
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-3 lg:grid-cols-5">
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="certificates">Certificates</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <Button variant="government" asChild>
                <Link to="/services">
                  <Plus className="h-4 w-4 mr-2" />
                  New Application
                </Link>
              </Button>
            </div>

            <TabsContent value="applications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>My Applications</span>
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
                  <div className="space-y-4">
                    {applications.map((app, index) => (
                      <Card key={app.id} className="border-l-4 border-l-primary/20 hover:border-l-primary transition-colors animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                {getStatusIcon(app.status)}
                                <h3 className="font-semibold text-lg">{app.title}</h3>
                                {getStatusBadge(app.status)}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium">Application ID:</span>
                                  <p>{app.applicationId}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Department:</span>
                                  <p>{app.department}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Submitted:</span>
                                  <p>{new Date(app.submittedDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Fees:</span>
                                  <p>{app.fees}</p>
                                </div>
                              </div>
                              
                              {app.status === "processing" && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span>{app.progress}%</span>
                                  </div>
                                  <Progress value={app.progress} className="h-2" />
                                </div>
                              )}
                              
                              {app.status === "rejected" && (
                                <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                                  <p className="text-sm text-destructive">
                                    <strong>Rejection Reason:</strong> {app.rejectionReason}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              {app.status === "approved" && (
                                <Button variant="government" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Digital Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Certificates Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Your approved applications will appear here as digital certificates
                    </p>
                    <Button variant="government" asChild>
                      <Link to="/services">Browse Services</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                      <div>
                        <p className="font-medium">Application Approved</p>
                        <p className="text-sm text-muted-foreground">Your Shop & Establishment License has been approved</p>
                        <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                      <Clock className="h-5 w-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium">Document Verification in Progress</p>
                        <p className="text-sm text-muted-foreground">Your Vehicle Registration is under review</p>
                        <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                      </div>
                    </div>
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

export default Dashboard;
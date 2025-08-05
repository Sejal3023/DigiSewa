import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Download,
  Eye,
  Smartphone,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TrackApplication = () => {
  const [applicationId, setApplicationId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock application data
  const mockApplications: { [key: string]: any } = {
    "SHE2024001": {
      id: "SHE2024001",
      title: "Shop & Establishment License",
      applicantName: "Rajesh Kumar Sharma",
      phone: "+91-9876543210",
      status: "approved",
      progress: 100,
      department: "Municipal Corporation",
      submittedDate: "2024-01-15",
      approvedDate: "2024-01-18",
      fees: "₹1,500",
      blockchainHash: "0x1a2b3c4d5e6f7890abcdef1234567890",
      steps: [
        { title: "Application Submitted", date: "2024-01-15 10:30 AM", status: "completed" },
        { title: "Document Verification", date: "2024-01-16 02:15 PM", status: "completed" },
        { title: "Officer Review", date: "2024-01-17 11:45 AM", status: "completed" },
        { title: "Final Approval", date: "2024-01-18 04:20 PM", status: "completed" },
        { title: "Certificate Generated", date: "2024-01-18 04:25 PM", status: "completed" }
      ]
    },
    "VEH2024002": {
      id: "VEH2024002", 
      title: "Vehicle Registration",
      applicantName: "Priya Patel",
      phone: "+91-9876543211",
      status: "processing",
      progress: 75,
      department: "Regional Transport Office",
      submittedDate: "2024-01-20",
      fees: "₹850",
      estimatedCompletion: "2024-01-25",
      blockchainHash: "Pending - Will be generated on approval",
      steps: [
        { title: "Application Submitted", date: "2024-01-20 09:15 AM", status: "completed" },
        { title: "Document Verification", date: "2024-01-21 03:30 PM", status: "completed" },
        { title: "Physical Inspection", date: "2024-01-22 10:00 AM", status: "completed" },
        { title: "Final Processing", date: "In Progress", status: "current" },
        { title: "RC Generation", date: "Pending", status: "pending" }
      ]
    },
    "FSS2024003": {
      id: "FSS2024003",
      title: "FSSAI Food Safety License",
      applicantName: "Mohammed Ali Khan",
      phone: "+91-9876543212", 
      status: "pending",
      progress: 25,
      department: "Food & Drug Administration",
      submittedDate: "2024-01-22",
      fees: "₹2,000",
      estimatedCompletion: "2024-01-30",
      blockchainHash: "Pending - Will be generated on approval",
      steps: [
        { title: "Application Submitted", date: "2024-01-22 02:45 PM", status: "completed" },
        { title: "Initial Review", date: "In Progress", status: "current" },
        { title: "Site Inspection", date: "Pending", status: "pending" },
        { title: "License Approval", date: "Pending", status: "pending" },
        { title: "Certificate Issue", date: "Pending", status: "pending" }
      ]
    }
  };

  const handleSearch = () => {
    if (!applicationId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an application ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const result = mockApplications[applicationId.toUpperCase()];
      
      if (result) {
        setSearchResult(result);
        toast({
          title: "Application Found",
          description: `Found application: ${result.title}`,
        });
      } else {
        setSearchResult(null);
        toast({
          title: "Not Found",
          description: "No application found with this ID",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-success";
      case "processing": return "text-warning";
      case "pending": return "text-muted-foreground";
      case "rejected": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Track Your Application</h1>
            <p className="text-lg text-muted-foreground">
              Enter your application ID to get real-time status updates
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Application Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicationId">Application ID *</Label>
                    <Input
                      id="applicationId"
                      placeholder="e.g., SHE2024001, VEH2024002"
                      value={applicationId}
                      onChange={(e) => setApplicationId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      placeholder="+91-XXXXXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading}
                  className="w-full md:w-auto"
                  variant="government"
                >
                  {isLoading ? "Searching..." : "Track Application"}
                  <Search className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              {/* Sample IDs */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Try these sample Application IDs:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(mockApplications).map(id => (
                    <Badge 
                      key={id} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setApplicationId(id)}
                    >
                      {id}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Application Overview */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      {searchResult.title}
                    </CardTitle>
                    {getStatusBadge(searchResult.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Applicant:</span>
                        <span>{searchResult.applicantName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span>{searchResult.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Department:</span>
                        <span>{searchResult.department}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Submitted:</span>
                        <span>{new Date(searchResult.submittedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Fees:</span>
                        <span>{searchResult.fees}</span>
                      </div>
                      {searchResult.estimatedCompletion && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Est. Completion:</span>
                          <span>{new Date(searchResult.estimatedCompletion).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Blockchain:</span>
                        <span className="text-xs break-all">
                          {searchResult.blockchainHash.length > 20 
                            ? searchResult.blockchainHash.substring(0, 20) + "..." 
                            : searchResult.blockchainHash}
                        </span>
                      </div>
                      {searchResult.status === "approved" && (
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View Certificate
                          </Button>
                          <Button size="sm" variant="government">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {searchResult.status !== "approved" && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Application Progress</span>
                        <span className="text-sm text-muted-foreground">{searchResult.progress}%</span>
                      </div>
                      <Progress value={searchResult.progress} className="h-3" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Application Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {searchResult.steps.map((step: any, index: number) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {step.status === "completed" && (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          )}
                          {step.status === "current" && (
                            <div className="h-5 w-5 rounded-full bg-warning animate-pulse" />
                          )}
                          {step.status === "pending" && (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${step.status === "current" ? "text-warning" : ""}`}>
                              {step.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {step.date}
                            </p>
                          </div>
                          {step.status === "current" && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Currently being processed...
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Blockchain Verification */}
              {searchResult.status === "approved" && (
                <Card className="border-success/50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-success">
                      <Shield className="h-5 w-5 mr-2" />
                      Blockchain Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-4 bg-success/5 rounded-lg">
                        <p className="text-sm mb-2">
                          <strong>Transaction Hash:</strong>
                        </p>
                        <p className="text-xs font-mono break-all text-success">
                          {searchResult.blockchainHash}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ✅ This certificate is cryptographically secured on the blockchain and cannot be tampered with.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TrackApplication;
import { useState , useEffect} from "react";
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
  Shield,
  Mail,
  Upload,
  Award,
  Settings,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { getApiUrl } from "@/config/api"; // ✅ ADD THIS LINE

interface Application {
  id: string;
  license_type: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  department: string;
  submission_date: string;
  created_at: string;
  updated_at: string;
  blockchain_tx_hash?: string;
  ipfs_hash?: string;
  document_hash?: string;
}

interface License {
  license_number?: string;
  expiry_date?: string;
  blockchain_hash?: string;
}

interface TimelineItem {
  status: string;
  notes: string;
  created_at: string;
  icon?: string;
}

interface Document {
  id: string;
  original_name: string;
  filename: string;
  status: string;
  uploaded_at: string;
  ipfs_hash?: string;
  cid?: string;
}

interface TrackingData {
  application: Application;
  license?: License;
  timeline: TimelineItem[];
  documents: Document[];
  document_count: number;
  current_stage: {
    stage: number;
    name: string;
    description: string;
  };
  progress: number;
}

const TrackApplication = () => {
  const { id } = useParams<{ id?: string }>(); // ✅ ADD THIS LINE
  const [applicationId, setApplicationId] = useState("");
  const [searchResult, setSearchResult] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false); // ✅ ADD THIS
  const { toast } = useToast();
 // ✅ ADD THIS useEffect (after the state declarations):
  useEffect(() => {
    if (id) {
      // Auto-fill input and auto-search when ID comes from URL
      setApplicationId(id);
      handleSearchById(id);
    }
  }, [id]);

  // ✅ MODIFY handleSearch to use a helper function:
  const handleSearchById = async (searchId: string) => {
    if (!searchId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an application ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(getApiUrl(`/applications/track/${searchId}`));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Application not found with this ID");
        }
        throw new Error("Failed to fetch application details");
      }

      const result = await response.json();
      
      if (result.success) {
        setSearchResult(result.data);
        toast({
          title: "Application Found",
          description: `Tracking ${result.data.application.license_type}`,
        });
      } else {
        throw new Error(result.error || "Failed to fetch application");
      }
      
    } catch (error: any) {
      setSearchResult(null);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    handleSearchById(applicationId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case "processing": 
        return <Badge className="bg-blue-500 text-white">Processing</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pending Review</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Settings className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTimelineIcon = (icon?: string) => {
    switch (icon) {
      case 'file-text':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'upload':
        return <Upload className="h-4 w-4 text-green-500" />;
      case 'shield':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'award':
        return <Award className="h-4 w-4 text-green-500" />;
      case 'check-circle':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'settings':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'x-circle':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatLicenseType = (licenseType: string) => {
    const typeMap: { [key: string]: string } = {
      'shop-establishment': 'Shop & Establishment License',
      'vehicle-registration': 'Vehicle Registration',
      'fssai-license': 'FSSAI Food License',
      'building-permit': 'Building Construction Permit',
      'income-certificate': 'Income Certificate',
      'police-verification': 'Police Verification Certificate'
    };
    return typeMap[licenseType] || licenseType;
  };

  const handleDownloadLicense = async () => {
    if (!searchResult?.license?.license_number) return;
    
    try {
      // This would call your backend to generate/download the license PDF
      const response = await fetch(getApiUrl(`/applications/track/${searchResult.application.id}/pdf`));
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `license_${searchResult.license.license_number}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download license",
        variant: "destructive"
      });
    }
  };

  const renderSearchResults = () => {
    if (!searchResult) return null;

    const { application, license, timeline, documents, current_stage, progress } = searchResult;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Application Overview */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {formatLicenseType(application.license_type)}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {getStatusBadge(application.status)}
                {application.blockchain_tx_hash && (
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Blockchain Verified
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Applicant:</span>
                  <span>{application.applicant_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span className="text-sm">{application.applicant_email}</span>
                </div>
                {application.applicant_phone && (
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{application.applicant_phone}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Department:</span>
                  <span>{application.department}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Submitted:</span>
                  <span>{new Date(application.submission_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Last Updated:</span>
                  <span>{new Date(application.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Current Stage:</span>
                  <span className="font-semibold">{current_stage.name}</span>
                </div>
                {license?.license_number && (
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">License No:</span>
                    <span className="font-mono text-sm">{license.license_number}</span>
                  </div>
                )}
                {license?.expiry_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Expires:</span>
                    <span>{new Date(license.expiry_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Application Progress</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">{current_stage.description}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-6">
              {application.status === "approved" && license && (
                <Button onClick={handleDownloadLicense} variant="government" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download License
                </Button>
              )}
              {application.blockchain_tx_hash && (
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  View Blockchain
                </Button>
              )}
             <Button variant="outline" size="sm" onClick={() => setShowFullDetails(!showFullDetails)}>
  <Eye className="h-4 w-4 mr-2" />
  {showFullDetails ? 'Hide Details' : 'View Full Details'}
</Button>

            </div>
          </CardContent>
        </Card>

        {/* Expandable Details Section */}
{showFullDetails && (
  <div className="mt-6 p-6 border-2 border-primary/20 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 animate-fade-in">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-lg flex items-center">
        <FileText className="h-5 w-5 mr-2 text-primary" />
        Complete Application Information
      </h4>
      <Badge variant="outline">Official Record</Badge>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="space-y-3">
        <div className="p-3 bg-white rounded border">
          <span className="font-medium text-muted-foreground block mb-1">Application UUID</span>
          <span className="font-mono text-xs break-all">{application.id}</span>
        </div>
        
        <div className="p-3 bg-white rounded border">
          <span className="font-medium text-muted-foreground block mb-1">License Category</span>
          <span>{formatLicenseType(application.license_type)}</span>
        </div>
        
        <div className="p-3 bg-white rounded border">
          <span className="font-medium text-muted-foreground block mb-1">Application Status</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(application.status)}
            <span className="capitalize">{application.status}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {application.ipfs_hash && (
          <div className="p-3 bg-white rounded border">
            <span className="font-medium text-muted-foreground block mb-1">IPFS Content Hash</span>
            <span className="font-mono text-xs break-all">{application.ipfs_hash}</span>
          </div>
        )}
        
        {application.document_hash && (
          <div className="p-3 bg-white rounded border">
            <span className="font-medium text-muted-foreground block mb-1">Document SHA-256 Hash</span>
            <span className="font-mono text-xs break-all">{application.document_hash}</span>
          </div>
        )}
        
        <div className="p-3 bg-white rounded border">
          <span className="font-medium text-muted-foreground block mb-1">Created On</span>
          <span>{new Date(application.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
    
    {/* Verification Notice */}
    <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded flex items-start gap-2">
      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
      <div className="text-sm text-blue-800">
        <p className="font-medium">Official Government Record</p>
        <p className="text-xs mt-1">This information is cryptographically verified and maintained by the Government of India's digital infrastructure.</p>
      </div>
    </div>
  </div>
)}


        {/* Application Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Application Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timeline.map((step, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {getTimelineIcon(step.icon)}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-6 bg-muted mx-auto mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${
                        step.status === 'approved' ? 'text-green-600' : 
                        step.status === 'rejected' ? 'text-red-600' : 
                        'text-foreground'
                      }`}>
                        {step.notes}
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                        {new Date(step.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 ${
                        step.status === 'approved' ? 'border-green-200 text-green-700' : 
                        step.status === 'rejected' ? 'border-red-200 text-red-700' : 
                        ''
                      }`}
                    >
                      {step.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        {documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Uploaded Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{doc.original_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()} • 
                          {doc.cid && ` CID: ${doc.cid.substring(0, 8)}...`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={doc.status === 'verified' ? 'default' : 'outline'}>
                        {doc.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blockchain Verification */}
        {application.blockchain_tx_hash && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Shield className="h-5 w-5 mr-2" />
                Blockchain Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-green-100 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Transaction Hash:
                  </p>
                  <p className="text-xs font-mono break-all text-green-700">
                    {application.blockchain_tx_hash}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>This application is cryptographically secured on the blockchain</span>
                </div>
                {license?.blockchain_hash && (
                  <div className="flex items-center space-x-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>License is also recorded on blockchain for verification</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
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
                <div>
                  <Label htmlFor="applicationId">Application ID *</Label>
                  <Input
                    id="applicationId"
                    placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    className="mt-1 font-mono"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your application UUID to track its status
                  </p>
                </div>
                
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading}
                  className="w-full md:w-auto"
                  variant="government"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      Track Application
                      <Search className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              
              {/* Help Text */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Where to find your Application ID?
                    </p>
                    <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                      <li>Check your application confirmation email</li>
                      <li>Look in your dashboard under "My Applications"</li>
                      <li>Contact support if you've lost your Application ID</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {renderSearchResults()}

          {/* No Results State */}
          {!searchResult && !isLoading && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Application Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Enter an Application ID above to track your application status
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Add the missing Info icon component
const Info = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default TrackApplication;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
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
  Bell,
  Loader2
} from "lucide-react";
//import WalletConnect from "@/components/WalletConnect";
import { decryptDocument } from '@/lib/crypto';
import { apiService } from '@/services/apiService';

interface Document {
  id: string;
  name?: string;
  original_name?: string;
  cid?: string;
  ipfs_hash?: string;
  createdAt?: string;
  created_at?: string;
  departmentId?: string;
  accessPolicy?: string;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("applications");
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const { user, session } = useAuth();

// ✅ ADD THESE 4 LINES:
const [applications, setApplications] = useState<any[]>([]);
const [isLoadingApplications, setIsLoadingApplications] = useState(true);
const [appStats, setAppStats] = useState({
  total: 0, approved: 0, processing: 0, pending: 0, rejected: 0
});

// Certificates state
const [certificates, setCertificates] = useState<any[]>([]);
const [isLoadingCertificates, setIsLoadingCertificates] = useState(true);
const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

// Helper to format license type - FIXED VERSION
const formatLicenseType = (licenseType: string | undefined | null) => {
  // Add null/undefined check
  if (!licenseType) {
    console.warn('formatLicenseType received undefined or null:', licenseType);
    return 'License';
  }

  const types: { [key: string]: string } = {
    'building-permit': 'Building Permit',
    'vehicle-registration': 'Vehicle Registration',
    'fssai-license': 'Food Safety License',
    'shop-establishment': 'Shop & Establishment License',
    'income-certificate': 'Income Certificate',
    'police-verification': 'Police Verification',
    'drivers-license': 'Driver\'s License'
  };

  // Return mapped type if exists
  if (types[licenseType]) {
    return types[licenseType];
  }

  // Safe string splitting with error handling
  try {
    if (typeof licenseType === 'string') {
      return licenseType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return 'License';
  } catch (error) {
    console.error('Error formatting license type:', licenseType, error);
    return 'License';
  }
};

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "Guest";
    return user.full_name || user.email?.split('@')[0] || "User";
  };

  // Fetch user documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!session?.token) {
        setLoadingDocuments(false);
        return;
      }
      
      try {
        const response = await apiService.getUserDocuments();
        if (response.success) {
          setUserDocuments(response.data?.documents || []);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [session]);

  // ✅ ADD THIS useEffect:
useEffect(() => {
  const fetchApplications = async () => {
    if (!session?.token) {
      setIsLoadingApplications(false);
      return;
    }
    
    try {
      const response = await apiService.getUserApplications();
      if (response.success) {
        setApplications(response.data?.applications || []);
        setAppStats(response.data?.stats || { total: 0, approved: 0, processing: 0, pending: 0, rejected: 0 });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  fetchApplications();
}, [session]);

const [certificateError, setCertificateError] = useState<string | null>(null);

// Fetch user certificates
useEffect(() => {
  const fetchCertificates = async () => {
    if (!session?.token) {
      setIsLoadingCertificates(false);
      return;
    }

    try {
      setIsLoadingCertificates(true);
      setCertificateError(null);
      const response = await apiService.getUserCertificates();
      if (response.success) {
        setCertificates(response.data || []);
      } else {
        setCertificateError(response.message || 'Failed to fetch certificates');
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificateError('Failed to connect to the server or an unexpected error occurred.');
    } finally {
      setIsLoadingCertificates(false);
    }
  };

  fetchCertificates();
}, [session]);

// Download certificate handler
const handleCertificateDownload = async (certificate: any) => {
  const licenseNumber = certificate.license_number;
  setDownloadingCertId(licenseNumber);
  try {
    console.log(`📥 Downloading certificate: ${licenseNumber}`);

    // Use the correct API endpoint
    const response = await apiService.downloadLicense(licenseNumber);

    if (!response.ok) {
      // Check if response is JSON (error) or blob (success)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // Get the blob from response
    const blob = await response.blob();
    
    // Check if blob is empty
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `license_${licenseNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Certificate downloaded successfully');
  } catch (error: any) {
    console.error('❌ Certificate download failed:', error);
    alert(`Failed to download certificate: ${error.message}`);
  } finally {
    setDownloadingCertId(null);
  }
};


  // Download handler
  const handleDocumentDownload = async (docId: string) => {
    setDownloadingDocId(docId);
    try {
      console.log(`📥 Fetching document details for ID: ${docId}`);
      
      const detailsResponse = await apiService.getDocumentDetails(docId);
      
      if (!detailsResponse.success) {
        throw new Error(detailsResponse.message || 'Failed to fetch document details');
      }

      const docDetails = detailsResponse.data;
      console.log('Document details:', docDetails);

      const cid = docDetails.cid || docDetails.ipfs_hash;
      console.log(`📥 Fetching encrypted file from IPFS: ${cid}`);
      
      const encryptedResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'}/api/documents/proxy/${cid}`);
      
      if (!encryptedResponse.ok) {
        throw new Error('Failed to fetch encrypted file from IPFS');
      }

      const encryptedBuffer = await encryptedResponse.arrayBuffer();
      console.log(`✅ Encrypted file fetched (${encryptedBuffer.byteLength} bytes)`);

      console.log('🔐 Decrypting document...');
      const decryptedBuffer = await decryptDocument(
        encryptedBuffer,
        docDetails.aesKey || docDetails.encryption_key,
        docDetails.iv
      );

      const blob = new Blob([decryptedBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = docDetails.name || docDetails.original_name || 'document.pdf';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Document downloaded successfully');
    } catch (error: any) {
      console.error('❌ Download failed:', error);
      alert(`Failed to download document: ${error.message}`);
    } finally {
      setDownloadingDocId(null);
    }
  };

 

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case "processing": 
        return <Badge className="bg-yellow-500 text-white">Processing</Badge>;
      case "pending":
        return <Badge className="bg-gray-500 text-white">Pending</Badge>;
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
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const stats = [
  { label: "Total Applications", value: String(appStats.total), icon: FileText, color: "text-blue-600" },
  { label: "Approved", value: String(appStats.approved), icon: CheckCircle2, color: "text-green-600" },
  { label: "Processing", value: String(appStats.processing + appStats.pending), icon: Clock, color: "text-orange-600" },
  { label: "Rejected", value: String(appStats.rejected), icon: AlertCircle, color: "text-red-600" }
];


  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header userRole="citizen" />
        <main className="pt-8 pb-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading user data...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={user?.role as 'citizen' | 'officer' | 'admin' || "citizen"} />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {getUserDisplayName()}</h1>
            <p className="text-muted-foreground">Manage your applications and access government services</p>
            
            {/* User Info */}
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-muted-foreground">Email:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-muted-foreground">Role:</span>
                  <Badge variant="outline">{user.role || "citizen"}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-muted-foreground">Member Since:</span>
                  <span>{user.id ? new Date(user.id).toLocaleDateString() : "Unknown"}</span>

                </div>
              </div>
            </div>
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

         

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 md:grid-cols-3">
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="certificates">Certificates</TabsTrigger>
              </TabsList>
              <Button variant="default" asChild>
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
      {isLoadingApplications ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
          <p className="text-muted-foreground mb-4">Start your first application</p>
          <Button variant="default" asChild>
            <Link to="/services">New Application</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any, index: number) => (
            <Card key={app.id} className="border-l-4 border-l-primary/20 hover:border-l-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(app.status)}
                      <h3 className="font-semibold text-lg">{formatLicenseType(app.license_type)}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Application ID:</span>
                        <p className="truncate">{app.id.substring(0, 13)}...</p>
                      </div>
                      <div>
                        <span className="font-medium">Department:</span>
                        <p>{app.department}</p>
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span>
                        <p>{new Date(app.submission_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Documents:</span>
                        <p>{app.document_count || 0} files</p>
                      </div>
                    </div>
                    
                    {(app.status === "processing" || app.status === "pending") && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{app.progress}%</span>
                        </div>
                        <Progress value={app.progress} className="h-2" />
                      </div>
                    )}

                    {app.blockchain_tx_hash && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Blockchain Verified
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/track/${app.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Track
                      </Link>
                    </Button>
                    {app.can_download && (
                      <Button variant="default" size="sm" asChild>
                        <Link to={`/track/${app.id}/pdf`} target="_blank">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>


            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDocuments ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading documents...</p>
                    </div>
                  ) : userDocuments.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload your first document through an application form
                      </p>
                      <Button variant="default" asChild>
                        <Link to="/services">Start Application</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userDocuments.map((doc: any) => (
                        <Card key={doc.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-8 w-8 text-primary" />
                                <div>
                                  <h4 className="font-semibold">{doc.name || doc.original_name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Uploaded {new Date(doc.createdAt || doc.created_at).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    CID: {(doc.cid || doc.ipfs_hash)?.substring(0, 20)}...
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/documents/${doc.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Link>
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleDocumentDownload(doc.id)}
                                  disabled={downloadingDocId === doc.id}
                                >
                                  {downloadingDocId === doc.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
<TabsContent value="certificates" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>Digital Certificates</CardTitle>
    </CardHeader>
    <CardContent>
      {isLoadingCertificates ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading certificates...</p>
        </div>
      ) : certificateError ? (
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Certificates</h3>
          <p className="text-muted-foreground mb-4">{certificateError}</p>
          <Button variant="default" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Certificates Available</h3>
          <p className="text-muted-foreground mb-4">
            Your approved applications will appear here as digital certificates
          </p>
          <Button variant="default" asChild>
            <Link to="/services">Browse Services</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert: any) => (
            <Card key={cert.id} className="border-l-4 border-l-green-500/20 hover:border-l-green-500 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <h3 className="font-semibold text-lg">{cert.service_name}</h3>
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">License Number:</span>
                        <p className="font-mono text-xs">{cert.license_number}</p>
                      </div>
                      <div>
                        <span className="font-medium">Issue Date:</span>
                        <p>{new Date(cert.issue_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Expiry Date:</span>
                        <p>{new Date(cert.expiry_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Application Type:</span>
                        {/* FIXED: Use license_type instead of application_type */}
                        <p>{formatLicenseType(cert.license_type)}</p>
                      </div>
                    </div>

                    {cert.blockchain_hash && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Blockchain Verified
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleCertificateDownload(cert)}
                      disabled={downloadingCertId === cert.license_number}
                    >
                      {downloadingCertId === cert.license_number ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminHeader from "@/components/AdminHeader";
import { Footer } from "@/components/Footer";
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Shield,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Download,
  ExternalLink,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  license_type: string;
  status: string;
  submission_date: string;
  updated_at: string;
  blockchain_tx_hash: string;
  ipfs_hash: string;
  applicationdata: any;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  department_name: string;
  current_stage?: string;
}

interface LicenseInfo {
  type: string;
  displayName: string;
  description: string;
  department: string;
  fees: {
    min: string;
    max: string;
  };
  processingDays: number;
}

interface Document {
  id: string;
  filename: string;
  filetype: string;
  document_type: string;
  ipfs_hash: string;
  file_hash: string;
  uploaded_at: string;
  status: string;
  document_category: string;
}

interface Approval {
  id: string;
  approved_by: string;
  approver_name: string;
  approver_email: string;
  approver_role: string;
  department_name: string;
  remarks: string;
  approval_date: string;
  action_display: string;
}

interface TimelineEvent {
  event: string;
  event_date: string;
  actor: string;
  actor_name: string;
  description: string;
}

interface ProcessingMetrics {
  submittedDate: string;
  lastUpdated: string;
  expectedProcessingDays: number;
  actualProcessingDays: number | null;
  isOverdue: boolean;
  status: string;
  currentStage: string;
}

const ApplicationDetails = () => {
  const { id } = useParams<{ id: string }>();
  
  // ✅ ADD adminInfo state
  const [adminInfo, setAdminInfo] = useState<{
    fullName: string;
    role: string;
    department: string;
  } | null>(null);
  
  const [application, setApplication] = useState<Application | null>(null);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [processingMetrics, setProcessingMetrics] = useState<ProcessingMetrics | null>(null);
  const [reviewCode, setReviewCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    if (id && adminInfo) {
      fetchApplicationDetails();
    }
  }, [id, adminInfo]);

  const fetchApplicationDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await fetch(`${API_URL}/admin/applications/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplication(data.application);
        setLicenseInfo(data.licenseInfo);
        setDocuments(data.documents || []);
        setApprovals(data.approvals || []);
        setTimeline(data.timeline || []);
        setProcessingMetrics(data.processingMetrics);
        setReviewCode(data.reviewCode || "");
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to load application details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      toast({
        title: "Error",
        description: "Failed to load application details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/admin/applications/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ remarks })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Application Approved",
          description: `Transaction: ${data.txHash?.substring(0, 16)}...`,
        });
        setShowApproveDialog(false);
        fetchApplicationDetails();
      } else {
        const error = await response.json();
        toast({
          title: "Approval Failed",
          description: error.error || "Failed to approve application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/admin/applications/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Application Rejected",
          description: `Transaction: ${data.txHash?.substring(0, 16)}...`,
        });
        setShowRejectDialog(false);
        fetchApplicationDetails();
      } else {
        const error = await response.json();
        toast({
          title: "Rejection Failed",
          description: error.error || "Failed to reject application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      processing: "outline"
    };
    return variants[status] || "outline";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // ✅ Check for both isLoading and adminInfo
  if (isLoading || !adminInfo) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <AdminHeader adminInfo={adminInfo} />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The requested application could not be found.
              </p>
              <Button onClick={() => navigate('/admin/applications')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AdminHeader adminInfo={adminInfo} />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/applications')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Application Review
              </h1>
              <p className="text-xl text-muted-foreground">
                ID: {application.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(application.status)}
              <Badge variant={getStatusBadge(application.status)} className="text-lg px-4 py-2">
                {application.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">License Type</Label>
                    <p className="font-medium mt-1">{licenseInfo?.displayName || application.license_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="font-medium mt-1">{application.department_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Submission Date</Label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(application.submission_date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(application.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {licenseInfo?.description && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-muted-foreground">License Description</Label>
                    <p className="mt-2 text-sm text-muted-foreground">{licenseInfo.description}</p>
                  </div>
                )}

                {processingMetrics && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-muted-foreground">Processing Metrics</Label>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Expected Days:</span>
                        <span className="ml-2 font-medium">{processingMetrics.expectedProcessingDays}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Actual Days:</span>
                        <span className={`ml-2 font-medium ${processingMetrics.isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                          {processingMetrics.actualProcessingDays || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {application.applicationdata && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-muted-foreground">Application Data</Label>
                    <pre className="mt-2 p-4 bg-accent rounded-lg text-sm overflow-auto max-h-64">
                      {JSON.stringify(application.applicationdata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blockchain Verification */}
            {application.blockchain_tx_hash && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Blockchain Verification
                  </CardTitle>
                  <CardDescription>
                    Immutable record on Ethereum blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Transaction Hash</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-accent rounded text-sm font-mono break-all">
                        {application.blockchain_tx_hash}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://etherscan.io/tx/${application.blockchain_tx_hash}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {application.ipfs_hash && (
                    <div>
                      <Label className="text-muted-foreground">IPFS Hash</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-accent rounded text-sm font-mono break-all">
                          {application.ipfs_hash}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://ipfs.io/ipfs/${application.ipfs_hash}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Uploaded Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.filetype} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No documents uploaded
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Approval History */}
            {approvals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Approval History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {approvals.map((approval) => (
                      <div key={approval.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{approval.approver_name}</p>
                          <Badge variant="outline">{approval.department_name}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(approval.approval_date).toLocaleString()}
                        </p>
                        <p className="text-sm">{approval.remarks}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Applicant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium mt-1">{application.applicant_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p className="font-medium mt-1 break-all">{application.applicant_email}</p>
                </div>
                {application.applicant_phone && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <p className="font-medium mt-1">{application.applicant_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {application.status !== 'approved' && ((application.status === 'pending' && adminInfo?.role !== 'super_admin') ||
              (application.current_stage === 'department_approved' && adminInfo?.role === 'super_admin') ||
              (application.current_stage === 'transferred_to_super_admin' && adminInfo?.role === 'super_admin')) && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>
                    {application.status === 'department_approved'
                      ? 'Final super admin approval - this will generate the license certificate'
                      : 'Review and approve or reject this application'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => setShowApproveDialog(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {application.status === 'department_approved' ? 'Approve & Generate License' : 'Approve Application'}
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Status Information for Super Admin */}
            {application.status === 'department_approved' && adminInfo?.role === 'super_admin' && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Shield className="h-5 w-5" />
                    Super Admin Final Review
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    This application has been approved by all required departments and is awaiting your final approval.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p>• All department approvals completed</p>
                    <p>• Ready for final license generation</p>
                    <p>• Your approval will create the official certificate</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              This will approve the application and record it on the blockchain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="Add any remarks or notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ApplicationDetails;

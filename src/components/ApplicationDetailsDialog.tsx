import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  Hash,
  Link as LinkIcon
} from "lucide-react";
import { useState } from "react";

interface ApplicationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  onApprove: (remarks: string) => void;
  onReject: (remarks: string) => void;
  onSetProcessing: () => void;
  loading?: boolean;
}

export function ApplicationDetailsDialog({
  open,
  onOpenChange,
  application,
  onApprove,
  onReject,
  onSetProcessing,
  loading = false
}: ApplicationDetailsDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  if (!application) return null;

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!remarks.trim()) {
      return;
    }
    setActionLoading(true);
    try {
      if (action === 'approve') {
        await onApprove(remarks);
      } else {
        await onReject(remarks);
      }
      setRemarks("");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-primary" />
            Application Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and ID */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(application.status)}>
                {application.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {application.id.substring(0, 8)}...
              </span>
            </div>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(application.submission_date).toLocaleDateString()}
            </span>
          </div>

          <Separator />

          {/* Applicant Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Applicant Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{application.user_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{application.user_email}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* License Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">License Information</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">License Type</p>
              <p className="font-semibold text-lg">{application.license_type}</p>
            </div>
          </div>

          {/* Documents */}
          {application.documents && application.documents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {application.documents.map((doc: any) => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{doc.doc_type}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Document ID: {doc.id.substring(0, 8)}...
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.file_url;
                              link.download = `${doc.doc_type}.pdf`;
                              link.click();
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Blockchain Info */}
          {(application.blockchain_tx_hash || application.ipfs_hash) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Blockchain & IPFS</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  {application.blockchain_tx_hash && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Blockchain TX</p>
                        <p className="font-mono text-xs break-all">{application.blockchain_tx_hash}</p>
                      </div>
                    </div>
                  )}
                  {application.ipfs_hash && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">IPFS Hash</p>
                        <p className="font-mono text-xs break-all">{application.ipfs_hash}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Approval History */}
          {application.approvals && application.approvals.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Approval History</h3>
                <div className="space-y-2">
                  {application.approvals.map((approval: any, index: number) => (
                    <div key={index} className="border-l-2 border-primary pl-4 py-2">
                      <p className="font-medium">{approval.department_name}</p>
                      <p className="text-sm text-muted-foreground">{approval.remarks}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(approval.approval_date).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Admin Actions */}
          {application.status === 'pending' || application.status === 'processing' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Admin Actions</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks / Reason *</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Enter your remarks or reason for approval/rejection..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={!remarks.trim() || actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  
                  <Button
                    onClick={() => handleAction('reject')}
                    disabled={!remarks.trim() || actionLoading}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>

                  {application.status === 'pending' && (
                    <Button
                      onClick={() => {
                        onSetProcessing();
                        setRemarks("");
                      }}
                      variant="outline"
                      disabled={actionLoading}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Set to Processing
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

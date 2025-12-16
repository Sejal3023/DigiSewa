import React, { useState } from 'react';
import { X, User, FileText, Calendar, MapPin, Phone, Mail, Hash, Send, CheckCircle,CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TransferApplicationDialog } from './TransferApplicationDialog';
import { Label } from '@/components/ui/label';
import { DocumentVerificationDialog } from './DocumentVerificationDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ApplicationDetailsDialogProps {
  application: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (remarks: string) => Promise<void>;
  onReject: (remarks: string) => Promise<void>;
  onSetProcessing: (remarks: string) => Promise<void>;
  onTransfer?: (remarks: string) => Promise<void>;  // ✅ FIXED: Added Promise<void>
  onViewDocument?: (documentId: string) => void;
  processing?: boolean;
  departmentName: string;
  onVerifyDocument?: (document: any) => void;  // ✅ FIXED: Added onVerifyDocument
}

export function ApplicationDetailsDialog({
  application,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onSetProcessing,
  onTransfer,  // ✅ ADD THIS
  onViewDocument,
  onVerifyDocument,  // ✅ ADD THIS to destructuring
  processing = false,
  departmentName
}: ApplicationDetailsDialogProps) {
  const [remarks, setRemarks] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | 'processing' | 'transfer' | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [approvalComplete, setApprovalComplete] = useState(false);
  const [showSuperAdminRemarks, setShowSuperAdminRemarks] = useState(false);
  const [superAdminRemarks, setSuperAdminRemarks] = useState('');
  // Add to state
const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const handleAction = async () => {
    if (action === 'approve') {
      await onApprove(remarks);
      setApprovalComplete(true);
    } else if (action === 'reject') {
      await onReject(remarks);
    } else if (action === 'processing') {
      await onSetProcessing(remarks);
    }
    setRemarks('');
    setAction(null);
  };

  const handleClose = () => {
    setRemarks('');
    setAction(null);
    setApprovalComplete(false);
    setShowSuperAdminRemarks(false);
    setSuperAdminRemarks('');
    onOpenChange(false);
  };

  // Add handler function
const handleVerifyDocument = (doc: any) => {
  setSelectedDoc(doc);
  setVerifyDialogOpen(true);
};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500 text-white">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-gray-500 text-white">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!application) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>Application Details - {departmentName}</span>
              </div>
              {getStatusBadge(application?.status || 'pending')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Application Information */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <Hash className="h-5 w-5 mr-2" />
                Application Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Application ID</label>
                  <p className="text-sm font-mono font-semibold">{application?.id?.slice(0, 16)}...</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm font-semibold capitalize">{application?.status || 'Pending'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-sm font-mono">{application?.user_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submission Date</label>
                  <p className="text-sm">
                    {application?.submission_date ? 
                      new Date(application.submission_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* License Type */}
            <div className="border rounded-lg p-4">
              <label className="text-sm font-semibold">License Type</label>
              <p className="text-lg mt-1">{application?.license_type}</p>
            </div>

            {/* Application Data */}
            {application?.application_data && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Applicant Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(application.application_data).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="text-sm font-medium">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blockchain Info */}
            {application?.blockchain_tx_hash && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <label className="text-sm font-semibold flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Blockchain Transaction Hash
                </label>
                <p className="text-xs font-mono mt-2 break-all text-blue-600">
                  {application.blockchain_tx_hash}
                </p>
              </div>
            )}

          {/* Uploaded Documents Section with Verification */}
{application?.documents && application.documents.length > 0 && (
  <div className="border rounded-lg p-4 bg-purple-50">
    <h3 className="font-semibold text-lg mb-3 flex items-center justify-between">
      <span className="flex items-center">
        <FileText className="h-5 w-5 mr-2 text-purple-700" />
        Uploaded Documents
      </span>
      <span className="text-xs text-muted-foreground">
        {application.documents.filter((d: any) => d.status === 'approved').length} / {application.documents.length} Verified
      </span>
    </h3>
    <ul className="divide-y divide-purple-200 space-y-2">
      {application.documents.map((doc: any) => {
        const isApproved = doc.status === 'approved';
        const isRejected = doc.status === 'rejected';
        const isPending = !isApproved && !isRejected;
        
        return (
          <li key={doc.id} className="py-3 flex flex-col space-y-2">
            {/* Document Info Row */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-purple-900">
                    {doc.original_name || `Document ${doc.id}`}
                  </p>
                  {/* Status Badge */}
                  {isApproved && (
                    <Badge className="bg-green-500 text-white text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {isRejected && (
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  )}
                  {isPending && (
                    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {doc.file_type}, {(doc.file_size / 1024).toFixed(1)} KB
                </p>
                <p className="text-xs text-muted-foreground">
                  CID: <span className="font-mono text-purple-700">{doc.cid?.substring(0, 20)}...</span>
                </p>
                {/* Verification Remarks */}
                {doc.verification_remarks && (
                  <div className="mt-2 p-2 bg-white rounded text-xs">
                    <span className="font-semibold text-muted-foreground">Officer Remarks: </span>
                    <span className={isRejected ? 'text-red-600' : 'text-green-600'}>
                      {doc.verification_remarks}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons Row */}
            <div className="flex gap-2">
              {onViewDocument && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDocument(doc.id)}
                  className="text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  View
                </Button>
              )}
              {onVerifyDocument && (
                <Button
  variant={isPending ? 'default' : 'outline'}
  size="sm"
  onClick={() => handleVerifyDocument(doc)}  // ✅ Use internal handler
  className={`text-xs ${isPending ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
>
  {isApproved ? 'Re-verify' : isRejected ? 'Review Again' : 'Verify'}
</Button>

              )}
            </div>
          </li>
        );
      })}
    </ul>
    
    {/* Document Verification Summary */}
    <div className="mt-4 pt-3 border-t border-purple-200">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-green-50 rounded">
          <p className="text-lg font-bold text-green-700">
            {application.documents.filter((d: any) => d.status === 'approved').length}
          </p>
          <p className="text-xs text-green-600">Approved</p>
        </div>
        <div className="p-2 bg-yellow-50 rounded">
          <p className="text-lg font-bold text-yellow-700">
            {application.documents.filter((d: any) => !['approved', 'rejected'].includes(d.status)).length}
          </p>
          <p className="text-xs text-yellow-600">Pending</p>
        </div>
        <div className="p-2 bg-red-50 rounded">
          <p className="text-lg font-bold text-red-700">
            {application.documents.filter((d: any) => d.status === 'rejected').length}
          </p>
          <p className="text-xs text-red-600">Rejected</p>
        </div>
      </div>
    </div>
  </div>
)}

            {/* ✅ POST-APPROVAL ACTIONS - ADD THIS SECTION */}
            {approvalComplete && !showSuperAdminRemarks && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Approval Complete - Next Steps</h3>
                </div>
                <p className="text-sm text-green-800 mb-4">
                  You have successfully approved this application. Choose next action:
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setTransferDialogOpen(true)}
                    className="gap-2 flex-1"
                    disabled={processing}
                  >
                    <Send className="h-4 w-4" />
                    Transfer to Another Department
                  </Button>
                  <Button
                    className="gap-2 flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowSuperAdminRemarks(true)}
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Send to Super Admin
                  </Button>
                </div>
              </div>
            )}

            {/* ✅ SUPER ADMIN TRANSFER REMARKS - ADD THIS SECTION */}
            {showSuperAdminRemarks && (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Transfer to Super Admin</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Please provide remarks for transferring to Super Admin:
                </p>
                <Textarea
                  placeholder="e.g., Requires final authorization from Super Admin..."
                  value={superAdminRemarks}
                  onChange={(e) => setSuperAdminRemarks(e.target.value)}
                  className="mb-3"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSuperAdminRemarks(false);
                      setSuperAdminRemarks('');
                    }}
                    size="sm"
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!superAdminRemarks || superAdminRemarks.trim().length < 10) {
                        alert('Please provide detailed remarks (minimum 10 characters)');
                        return;
                      }
                      
                      if (onTransfer) {
                        await onTransfer(superAdminRemarks);
                        setShowSuperAdminRemarks(false);
                        setSuperAdminRemarks('');
                        handleClose();
                      }
                    }}
                    disabled={processing}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {processing ? 'Transferring...' : 'Confirm Transfer'}
                  </Button>
                </div>
              </div>
            )}

            {/* Remarks Section */}
            {action && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <Label htmlFor="remarks" className="text-base font-semibold">
                  Officer Remarks
                  {action === 'reject' && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    action === 'reject' 
                      ? 'Please provide a detailed reason for rejection (Required)' 
                      : action === 'approve'
                      ? 'Optional: Add any approval notes or conditions'
                      : 'Optional: Add processing notes'
                  }
                  className="mt-2"
                  rows={4}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              {!action && !approvalComplete ? (
                <>
                  {/* Only show these buttons if the application is NOT already approved */}
                  {application?.status !== 'approved' && (application?.status === 'pending' || application?.status === 'department_approved' || application?.status === 'processing' || application?.status === 'rejected') && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setAction('processing')}
                        disabled={processing}
                      >
                        Set to Processing
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setAction('reject')}
                        disabled={processing}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => setAction('approve')}
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {application?.status === 'department_approved' ? 'Final Approve & Generate License' : 'Approve'}
                      </Button>
                    </>
                  )}
                  {/* Always show Close/Done button if not in action mode */}
                  {(application?.status === 'approved' || (application?.status !== 'pending' && application?.status !== 'department_approved' && application?.status !== 'processing' && application?.status !== 'rejected')) && (
                    <Button variant="outline" onClick={handleClose}>
                      Close
                    </Button>
                  )}
                </>
              ) : action ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAction(null);
                      setRemarks('');
                    }}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAction}
                    disabled={processing || (action === 'reject' && !remarks.trim())}
                    variant={action === 'reject' ? 'destructive' : action === 'approve' ? 'default' : 'outline'}
                    className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {processing 
                      ? 'Processing...' 
                      : action === 'approve' 
                        ? 'Confirm Approval' 
                        : action === 'reject' 
                          ? 'Confirm Rejection' 
                          : 'Confirm Status Change'
                    }
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={handleClose}>
                  Done
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      {application && (
        <TransferApplicationDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          applicationId={application.id}
          currentDepartment={departmentName}
          onTransferComplete={() => {
            setTransferDialogOpen(false);
            handleClose();
          }}
        />
      )}
      
      {/* ✅ ADD THIS - Document Verification Dialog */}
      <DocumentVerificationDialog
        open={verifyDialogOpen}
        onClose={() => {
          setVerifyDialogOpen(false);
          setSelectedDoc(null);
        }}
        document={selectedDoc}
        onVerificationComplete={() => {
          window.location.reload(); // Refresh to show updated status
        }}
      />
    </>
  );
}

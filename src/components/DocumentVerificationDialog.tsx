import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface DocumentVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  document: any;
  onVerificationComplete: () => void;
}

export const DocumentVerificationDialog = ({
  open,
  onClose,
  document,
  onVerificationComplete
}: DocumentVerificationDialogProps) => {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = () => {
    const status = document?.status || 'uploaded';
    switch (status) {
      case 'approved':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', text: 'Approved' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', text: 'Rejected' };
      default:
        return { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Pending Verification' };
    }
  };

  const handleSubmit = async () => {
    if (!action || !document?.id) return;

    if (action === 'reject' && !remarks.trim()) {
      toast({
        title: 'Remarks Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

      const response = await axios.post(
        `${API_BASE_URL}/documents/${document.id}/verify`,
        {
          status: action,
          remarks: remarks.trim() || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: 'Success',
        description: response.data.message || `Document ${action} successfully`,
      });

      onVerificationComplete();
      handleClose();

    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to verify document',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAction(null);
    setRemarks('');
    onClose();
  };

  if (!document) return null;

  const statusInfo = getStatusBadge();
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verify Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Info */}
          <div className={`p-3 rounded-lg ${statusInfo.bg}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm">{document.original_name || document.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {(document.file_size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className={`flex items-center gap-1 ${statusInfo.color}`}>
                <StatusIcon className="h-4 w-4" />
                <span className="text-xs font-medium">{statusInfo.text}</span>
              </div>
            </div>
          </div>

          {/* Existing Remarks (if any) */}
          {document.verification_remarks && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <Label className="text-xs font-semibold">Previous Remarks:</Label>
              <p className="text-sm mt-1">{document.verification_remarks}</p>
            </div>
          )}

          {/* Action Selection */}
          {!action && document.status !== 'approved' && (
            <div className="space-y-2">
              <Label>Choose Action:</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-green-200 hover:bg-green-50"
                  onClick={() => setAction('approve')}
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Approve</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-red-200 hover:bg-red-50"
                  onClick={() => setAction('reject')}
                >
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">Reject</span>
                </Button>
              </div>
            </div>
          )}

          {/* Remarks Input */}
          {action && (
            <div className="space-y-2">
              <div className={`p-3 rounded-lg ${action === 'approve' ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm font-medium">
                  {action === 'approve' ? '✅ Approving Document' : '❌ Rejecting Document'}
                </p>
              </div>

              <div>
                <Label htmlFor="remarks">
                  Remarks {action === 'reject' && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="remarks"
                  placeholder={
                    action === 'approve'
                      ? 'Optional: Add verification notes...'
                      : 'Required: Specify reason for rejection (e.g., Document unclear, information mismatch)...'
                  }
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
                {action === 'reject' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Please provide clear, specific reasons to help the applicant resubmit correctly.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {action ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setAction(null)} 
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || (action === 'reject' && !remarks.trim())}
                className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                variant={action === 'reject' ? 'destructive' : 'default'}
              >
                {isSubmitting ? 'Submitting...' : `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

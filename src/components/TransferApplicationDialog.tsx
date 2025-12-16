import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Copy, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  currentDepartment: string;
  onTransferComplete: () => void;
}

const DEPARTMENTS = [
  'Municipal Corporation',
  'Police Department',
  'Revenue Department',
  'Food Safety Department',
  'Regional Transport Office',
  'Labour Department',
];

export function TransferApplicationDialog({
  open,
  onOpenChange,
  applicationId,
  currentDepartment,
  onTransferComplete,
}: TransferDialogProps) {
  const { toast } = useToast();
  const [toDepartment, setToDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTransfer = async () => {
    if (!toDepartment || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a department and provide a reason",
        variant: "destructive",
      });
      return;
    }

    if (toDepartment === currentDepartment) {
      toast({
        title: "Invalid Transfer",
        description: "Cannot transfer to the same department",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/transfers/initiate`,
        {
          applicationId,
          toDepartmentName: toDepartment,
          transferReason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAccessCode(response.data.data.accessCode);
        setShowSuccess(true);
        
        toast({
          title: "Transfer Initiated!",
          description: `Application transferred to ${toDepartment}`,
        });

        // Call parent callback after a short delay
        setTimeout(() => {
          onTransferComplete();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccessCode = () => {
    if (accessCode) {
      navigator.clipboard.writeText(accessCode);
      toast({
        title: "Copied!",
        description: "Access code copied to clipboard",
      });
    }
  };

  const handleClose = () => {
    setToDepartment('');
    setReason('');
    setAccessCode(null);
    setShowSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>Transfer Application</DialogTitle>
              <DialogDescription>
                Transfer this application to another department for processing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-dept">Current Department</Label>
                <Input
                  id="current-dept"
                  value={currentDepartment}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="flex items-center justify-center py-2">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-dept">Transfer To Department</Label>
                <Select value={toDepartment} onValueChange={setToDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.filter(dept => dept !== currentDepartment).map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Transfer Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this application is being transferred..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Note:</p>
                  <p>An access code will be generated for the receiving department to accept this transfer.</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleTransfer} disabled={loading}>
                {loading ? 'Transferring...' : 'Transfer Application'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-green-600">✓ Transfer Successful</DialogTitle>
              <DialogDescription>
                Application has been transferred to {toDepartment}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Access Code Generated:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white border rounded font-mono text-lg">
                    {accessCode}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyAccessCode}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Share this code with the receiving department officer
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Application ID: <span className="font-mono">{applicationId}</span></p>
                <p>• From: {currentDepartment}</p>
                <p>• To: {toDepartment}</p>
                <p>• Reason: {reason}</p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

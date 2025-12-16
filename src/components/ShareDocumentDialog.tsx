import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Document, Department } from '@/types';
import departmentService from '@/services/departmentService';
import documentService from '@/services/documentService';
import { useToast } from '@/components/ui/use-toast';

interface ShareDocumentDialogProps {
  document: Document;
  onShareSuccess: () => void;
}

const ShareDocumentDialog: React.FC<ShareDocumentDialogProps> = ({ document, onShareSuccess }) => {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [accessPolicy, setAccessPolicy] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const fetchedDepartments = await departmentService.getDepartments();
        setDepartments(fetchedDepartments);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast({
          title: "Error",
          description: "Failed to load departments.",
          variant: "destructive",
        });
      }
    };
    if (open) {
      fetchDepartments();
    }
  }, [open, toast]);

  const handleShare = async () => {
    if (!selectedDepartment || !accessPolicy) {
      toast({
        title: "Missing Information",
        description: "Please select a department and specify an access policy.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await documentService.shareDocument(document.id, selectedDepartment, accessPolicy);
      toast({
        title: "Document Shared",
        description: `Document "${document.name}" shared successfully.`,
      });
      onShareSuccess();
      setOpen(false);
      setSelectedDepartment('');
      setAccessPolicy('');
    } catch (error) {
      console.error('Error sharing document:', error);
      toast({
        title: "Share Failed",
        description: "There was an error sharing the document.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" size="sm">Share</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Share Document: {document.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Select a department and define the access policy for this document.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Select onValueChange={setSelectedDepartment} value={selectedDepartment} disabled={isLoading}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="access-policy">Access Policy</Label>
            <Textarea
              id="access-policy"
              placeholder="e.g., view, download, edit"
              value={accessPolicy}
              onChange={(e) => setAccessPolicy(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleShare} disabled={isLoading || !selectedDepartment || !accessPolicy}>
            {isLoading ? 'Sharing...' : 'Share'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ShareDocumentDialog; 
import { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";

interface DocumentUploadProps {
  documentType: string;
  onDocumentUploaded: (documentType: string, fileInfo: any) => void;
  existingDocument?: any;
}

export const DocumentUpload = ({ documentType, onDocumentUploaded, existingDocument }: DocumentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(existingDocument || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, JPG, or PNG files only",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await documentService.uploadDocument(file, documentType);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const fileInfo = {
        id: result.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        fileUrl: result.fileUrl,
        blockchainHash: result.blockchainHash
      };

      setUploadedFile(fileInfo);
      onDocumentUploaded(documentType, fileInfo);

      toast({
        title: "Document uploaded successfully",
        description: `${file.name} has been uploaded and secured on blockchain`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    onDocumentUploaded(documentType, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium">{documentType}</p>
            <p className="text-sm text-muted-foreground">
              Upload clear, readable document (PDF, JPG, PNG - Max 5MB)
            </p>
            {uploadedFile && (
              <div className="mt-2 flex items-center space-x-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">{uploadedFile.fileName}</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {uploadedFile ? (
              <>
                <Button variant="outline" size="sm" onClick={handleRemoveFile}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleFileSelect}>
                  <Upload className="h-4 w-4 mr-2" />
                  Replace
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleFileSelect}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Uploading...</span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {uploadedFile && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Document Secured</p>
                <p className="text-xs text-green-600">
                  Blockchain Hash: {uploadedFile.blockchainHash?.substring(0, 16)}...
                </p>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};
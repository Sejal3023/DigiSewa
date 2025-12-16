import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { decryptDocument } from '@/lib/crypto';
import { Eye, Download, Loader2, AlertCircle, FileText } from 'lucide-react'; // Added FileText import
import { getApiUrl } from '@/config/api'; 

const DocumentView = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [document, setDocument] = useState<any>(null);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setError('Document ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching document details for ID:', id);
        
        const docResponse = await apiService.getDocumentDetails(id);
        console.log('Document response:', docResponse);
        
        if (docResponse.success && docResponse.data) {
          setDocument(docResponse.data);
          
          // Attempt to decrypt if encrypted
          if (docResponse.data.encrypted && docResponse.data.aesKey && docResponse.data.iv && docResponse.data.cid) {
            try {
              // Fetch encrypted content through backend proxy to avoid CORS
              //const proxyUrl = `/${docResponse.data.cid}`;
              const proxyUrl = getApiUrl(`/documents/proxy/${docResponse.data.cid}`);  // ✅ CORRECT
              console.log('Fetching encrypted content via proxy:', proxyUrl);

              const fetchResponse = await fetch(proxyUrl);
              if (!fetchResponse.ok) {
                throw new Error(`Failed to fetch document: ${fetchResponse.status}`);
              }

              const contentType = fetchResponse.headers.get('Content-Type');
              if (contentType && contentType.includes('text/html')) {
                const errorHtml = await fetchResponse.text();
                console.error('Received HTML instead of encrypted data:', errorHtml.substring(0, 500)); // Log first 500 chars
                throw new Error('Received HTML content instead of encrypted document. This might indicate a server-side error or redirection.');
              }

              const encryptedBuffer = await fetchResponse.arrayBuffer();
              console.log('Encrypted data received:', {
                length: encryptedBuffer.byteLength,
                cid: docResponse.data.cid
              });
              
              // Use the universal decryption function
              console.log('Starting decryption...');
              const decryptedBuffer = await decryptDocument(
                encryptedBuffer, 
                docResponse.data.aesKey, 
                docResponse.data.iv
              );
              
              console.log('Decryption successful, decrypted length:', decryptedBuffer.byteLength);
              
              // Convert decrypted buffer to a data URL for display
              const fileType = docResponse.data.name.split('.').pop()?.toLowerCase();
              let mimeType = 'application/octet-stream';
              
              const mimeTypes: { [key: string]: string } = {
                'pdf': 'application/pdf',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'txt': 'text/plain',
                'xls': 'application/vnd.ms-excel',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              };

              mimeType = mimeTypes[fileType || ''] || 'application/octet-stream';

              const decryptedBlob = new Blob([decryptedBuffer], { type: mimeType });
              const objectUrl = URL.createObjectURL(decryptedBlob);
              setDecryptedContent(objectUrl);

              console.log('Document ready for display, MIME type:', mimeType);

            } catch (decryptError: any) {
              console.error('Decryption failed:', decryptError);
              setError(`Failed to decrypt document: ${decryptError.message}`);
              setDecryptedContent(null);
              
              toast({
                title: "Decryption Failed",
                description: "Could not decrypt the document. It may be corrupted or use an unsupported format.",
                variant: "destructive",
              });
            }
          } else if (docResponse.data.cid) {
            // If not encrypted or missing key/IV, use the proxy link directly
            console.log('Document not encrypted, using direct proxy link');
            setDecryptedContent(`/documents/proxy/${docResponse.data.cid}`);
          } else {
            setError('Document content not available or missing CID.');
          }
        } else {
          const errorMsg = docResponse.message || 'Failed to fetch document details.';
          setError(errorMsg);
          console.error('API response not successful:', docResponse);
        }
      } catch (err: any) {
        console.error('Error fetching document:', err);
        const errorMsg = err.message || 'An unexpected error occurred while fetching the document.';
        setError(errorMsg);
        
        toast({
          title: "Error Loading Document",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id, toast]);

  const handleDownload = async () => {
    if (!document) return;

    setIsDownloading(true);
    try {
      // If we already have decrypted content, use it for download
      if (decryptedContent && !decryptedContent.startsWith('/documents/proxy/')) {
        const a = window.document.createElement('a');
        a.href = decryptedContent;
        a.download = document.name || 'document';
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        
        toast({
          title: "Download Successful",
          description: `Document "${document.name}" has been downloaded.`,
        });
        return;
      }

      // Otherwise, fetch and decrypt again for download
      console.log('Starting download process for:', document.name);
      
      if (!document.aesKey || !document.iv || !document.cid) {
        throw new Error('Document is missing encryption information');
      }

      // Fetch encrypted content
      //const proxyUrl = `/documents/proxy/${document.cid}`;
      const proxyUrl = getApiUrl(`/documents/proxy/${document.cid}`);  // ✅ CORRECT
      console.log('Downloading encrypted content via proxy:', proxyUrl);

      const fetchResponse = await fetch(proxyUrl);
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch document: ${fetchResponse.status}`);
      }

      const encryptedBuffer = await fetchResponse.arrayBuffer();
      
      // Decrypt using the universal decryption function
      const decryptedBuffer = await decryptDocument(encryptedBuffer, document.aesKey, document.iv);
      
      // Create downloadable blob
      const fileType = document.name.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream';

      const mimeTypes: { [key: string]: string } = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

      mimeType = mimeTypes[fileType || ''] || 'application/octet-stream';

      const decryptedBlob = new Blob([decryptedBuffer], { type: mimeType });
      const url = URL.createObjectURL(decryptedBlob);
      
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Download completed successfully');
      toast({
        title: "Download Successful",
        description: `Document "${document.name}" has been downloaded.`,
      });

    } catch (error: any) {
      console.error('Download failed:', error);
      
      let errorMessage = "Failed to download document. Please try again.";
      if (error.message.includes('Failed to fetch document')) {
        errorMessage = "Could not retrieve the document file. It might have been moved or deleted.";
      } else if (error.message.includes('missing encryption information')) {
        errorMessage = "This document is missing encryption information. Please contact support.";
      } else if (error.message.includes('decrypt')) {
        errorMessage = "Failed to decrypt the document. The encryption keys might be invalid.";
      }
      
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ext;
  };

  const canPreview = (filename: string): boolean => {
    const fileType = getFileType(filename);
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];
    return previewableTypes.includes(fileType);
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (decryptedContent && !decryptedContent.startsWith('/documents/proxy/')) {
        URL.revokeObjectURL(decryptedContent);
      }
    };
  }, [decryptedContent]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center space-x-3">
              <Eye className="h-6 w-6 text-primary" />
              <div>
                <span className="text-2xl">Document View</span>
                <p className="text-sm font-normal text-muted-foreground mt-1">
                  {document?.name || 'Loading document...'}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Loading document...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-destructive">
                <AlertCircle className="h-16 w-16 mb-4" />
                <p className="text-lg font-semibold mb-2">Unable to Load Document</p>
                <p className="text-muted-foreground text-center max-w-md">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                {/* Document Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/20 rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{document?.name}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {document?.uploadedAt && (
                        <span>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</span>
                      )}
                      {document?.fileSize && (
                        <span>Size: {(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      )}
                      {document?.encrypted && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Encrypted
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={handleDownload} 
                    disabled={!decryptedContent || isDownloading}
                    className="min-w-[120px]"
                  >
                    {isDownloading ? (
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

                {/* Document Preview */}
                {decryptedContent ? (
                  <div className="border-2 border-muted rounded-lg overflow-hidden bg-background">
                    <div className="bg-muted/30 px-4 py-2 border-b">
                      <p className="text-sm font-medium">Document Preview</p>
                    </div>
                    <div className="flex items-center justify-center min-h-[500px] max-h-[70vh] p-4">
                      {document?.name && canPreview(document.name) ? (
                        getFileType(document.name) === 'pdf' ? (
                          <iframe 
                            src={decryptedContent} 
                            className="w-full h-full min-h-[500px] border-0"
                            title={`Preview of ${document.name}`}
                          />
                        ) : (
                          <img 
                            src={decryptedContent} 
                            alt={`Preview of ${document.name}`}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              console.error('Image failed to load');
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <p className="text-lg font-medium text-muted-foreground mb-2">
                            Preview Not Available
                          </p>
                          <p className="text-sm text-muted-foreground max-w-md">
                            This file type cannot be previewed in the browser. 
                            Please download the document to view it.
                          </p>
                          <Button 
                            onClick={handleDownload} 
                            disabled={isDownloading}
                            className="mt-4"
                          >
                            {isDownloading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download Document
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">
                      No Content Available
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      The document content could not be loaded. This may be due to encryption issues, 
                      missing files, or network problems.
                    </p>
                  </div>
                )}

                {/* Additional Document Information */}
                {document && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/10 rounded-lg">
                    <div>
                      <h4 className="font-medium mb-2">Document Information</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex">
                          <dt className="w-32 text-muted-foreground">Name:</dt>
                          <dd className="flex-1 font-medium">{document.name}</dd>
                        </div>
                        {document.applicationId && (
                          <div className="flex">
                            <dt className="w-32 text-muted-foreground">Application ID:</dt>
                            <dd className="flex-1">{document.applicationId}</dd>
                          </div>
                        )}
                        {document.uploadedAt && (
                          <div className="flex">
                            <dt className="w-32 text-muted-foreground">Upload Date:</dt>
                            <dd className="flex-1">{new Date(document.uploadedAt).toLocaleString()}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Security Information</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex">
                          <dt className="w-32 text-muted-foreground">Encrypted:</dt>
                          <dd className="flex-1">
                            {document.encrypted ? (
                              <span className="text-green-600 font-medium">Yes</span>
                            ) : (
                              <span className="text-orange-600">No</span>
                            )}
                          </dd>
                        </div>
                        {document.cid && (
                          <div className="flex">
                            <dt className="w-32 text-muted-foreground">Content ID:</dt>
                            <dd className="flex-1 font-mono text-xs truncate" title={document.cid}>
                              {document.cid}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default DocumentView;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Document } from '@/types';
import ShareDocumentDialog from './ShareDocumentDialog';

interface DocumentCardProps {
  document: Document;
  onShareSuccess: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onShareSuccess }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{document.name}</CardTitle>
        <CardDescription>Owner: {document.owner}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">CID: {document.cid}</p>
        <p className="text-sm text-muted-foreground">Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</p>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" size="sm">View</Button>
          <ShareDocumentDialog document={document} onShareSuccess={onShareSuccess} />
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;

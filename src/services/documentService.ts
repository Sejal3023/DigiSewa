import { supabase } from "@/integrations/supabase/client";

export interface DocumentUploadResult {
  id: string;
  fileUrl: string;
  blockchainHash: string;
}

class DocumentService {
  async uploadDocument(file: File, documentType: string): Promise<DocumentUploadResult> {
    try {
      // Generate unique file name
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `documents/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Generate blockchain hash (mock implementation)
      const blockchainHash = await this.generateBlockchainHash(file);

      // Store document metadata in database
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          file_url: publicUrl,
          doc_type: documentType,
          application_id: null // Will be set when application is created
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      return {
        id: documentData.id,
        fileUrl: publicUrl,
        blockchainHash
      };

    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Get document info first
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch document: ${fetchError.message}`);
      }

      // Extract file path from URL
      const url = new URL(document.file_url);
      const filePath = url.pathname.split('/').pop();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([`documents/${filePath}`]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

    } catch (error) {
      console.error('Document deletion error:', error);
      throw error;
    }
  }

  async getDocumentsByApplication(applicationId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', applicationId);

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return data;
  }

  async updateDocumentApplication(documentId: string, applicationId: string) {
    const { error } = await supabase
      .from('documents')
      .update({ application_id: applicationId })
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  private async generateBlockchainHash(file: File): Promise<string> {
    // Mock blockchain hash generation
    // In a real implementation, this would:
    // 1. Calculate file hash (SHA-256)
    // 2. Submit to blockchain network
    // 3. Return transaction hash
    
    const arrayBuffer = await file.arrayBuffer();
    const hashArray = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashHex = Array.from(new Uint8Array(hashArray))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Mock blockchain transaction hash
    return `0x${hashHex.substring(0, 32)}${Math.random().toString(16).substring(2, 10)}`;
  }
}

export const documentService = new DocumentService();
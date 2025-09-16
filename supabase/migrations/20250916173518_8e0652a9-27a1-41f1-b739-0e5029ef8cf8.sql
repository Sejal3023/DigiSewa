-- Make documents bucket public so users can access their uploaded documents
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- Create a more secure RLS policy for document access
CREATE POLICY "Users can view documents they uploaded through applications" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = 'documents' AND
  EXISTS (
    SELECT 1 FROM documents d
    JOIN applications a ON d.application_id = a.id
    WHERE d.file_url LIKE '%' || name || '%'
    AND a.user_id = auth.uid()
  )
);

-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);
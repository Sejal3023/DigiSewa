-- Add foreign key constraint between documents and applications
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_application 
FOREIGN KEY (application_id) 
REFERENCES applications(id) 
ON DELETE CASCADE;
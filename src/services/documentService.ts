import { apiService } from './apiService';
import { Document, DocumentPermission } from '@/types';

const documentService = {
  uploadDocumentFile: async (file: File, params: { departmentId: string; applicationId: string; name?: string; accessPolicy?: string; }): Promise<any> => {
    const form = new FormData();
    form.append('document', file);
    form.append('departmentId', params.departmentId);
    form.append('applicationId', params.applicationId);
    if (params.name) form.append('name', params.name);
    if (params.accessPolicy) form.append('accessPolicy', params.accessPolicy);

    return apiService.postMultipart('/documents/upload', form);
  },

  getDocuments: async (): Promise<Document[]> => {
    const response = await apiService.get('/documents');
    return response.data;
  },

  getDocumentById: async (id: string): Promise<Document> => {
    const response = await apiService.get(`/documents/${id}`);
    return response.data;
  },

  shareDocument: async (documentId: string, departmentId: string, accessPolicy: string): Promise<DocumentPermission> => {
    const response = await apiService.post(`/documents/${documentId}/share`, { departmentId, accessPolicy });
    return response.data;
  },

  getSharedDocuments: async (): Promise<DocumentPermission[]> => {
    const response = await apiService.get('/documents/shared');
    return response.data;
  },
};

export default documentService;

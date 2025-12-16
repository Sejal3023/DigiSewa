export interface Document {
  id: string;
  name: string;
  cid: string;
  owner: string;
  uploadedAt: string;
  aesKey?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  role: 'citizen' | 'officer' | 'admin';
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  departmentId: string;
  accessPolicy: string; // e.g., "view", "edit", "download"
  grantedBy: string;
  grantedAt: string;
}

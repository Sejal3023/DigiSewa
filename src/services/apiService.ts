import { getApiUrl } from '@/config/api';

// API Service for DigiSewa Backend Integration
class ApiService {
  private getAuthToken(): string | null {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      return adminToken;
    }
    return localStorage.getItem('auth_token');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth
  async getProfile() {
    return this.makeRequest('/profile');
  }
async updateProfile(data: { 
  full_name: string; 
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  return this.makeRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async getUserActivity() {
  return this.makeRequest('/profile/activity');
}

  // Applications
  async createApplication(data: {
    license_type: string;
    application_data: Record<string, unknown>;
    documentContentBase64?: string;
    filename?: string;
  }) 
  {// Map frontend keys to backend keys
  const payload = {
    license_type: data.license_type,
    application_data: data.application_data,
    documentContentBase64: data.documentContentBase64,
    filename: data.filename,
      };
    return this.makeRequest('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getApplication(id: string) {
    return this.makeRequest(`/applications/${id}`);
  }

  async getOfficerApplications() {
    return this.makeRequest('/officer/applications');
  }

  async verifyApplication(id: string, documentContentBase64: string) {
    return this.makeRequest(`/applications/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ documentContentBase64 }),
    });
  }

  async issueApplication(id: string) {
    return this.makeRequest(`/applications/${id}/issue`, {
      method: 'POST',
    });
  }

  async revokeApplication(id: string, reason?: string) {
    return this.makeRequest(`/applications/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Licenses
  async getLicense(id: string) {
    return this.makeRequest(`/licenses/${id}`);
  }

  async verifyLicense(id: string) {
    // This endpoint doesn't require auth
    const response = await fetch(getApiUrl(`/licenses/${id}/verify`));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async getUserCertificates() {
    return this.makeRequest('/licenses/user/certificates');
  }

  async downloadLicense(licenseNumber: string) {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(getApiUrl(`/licenses/${licenseNumber}/download`), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }
  // ✅ ADD THIS ONE METHOD ONLY:
async getUserApplications() {
  return this.makeRequest('/applications/user/my-applications');
}

  // Blockchain
  async getTransaction(txHash: string) {
    return this.makeRequest(`/blockchain/tx/${txHash}`);
  }

  // Health check
  async get(endpoint: string) {
    return this.makeRequest(endpoint, { method: 'GET' });
  }
// Add these methods to your ApiService class:

async getUserDocuments() {
  return this.makeRequest('/documents/user');
}

async getDocumentDetails(id: string) {
  return this.makeRequest(`/documents/${id}`);
}

async uploadDocumentFile(formData: FormData) {
  return this.postMultipart('/documents/upload', formData);
}

async getNotifications() {
  return this.makeRequest('/notifications/user');
}

  async post(endpoint: string, data: any) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Multipart (file upload)
  async postMultipart(endpoint: string, formData: FormData) {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers, // Do not set Content-Type so browser sets boundary
      body: formData as unknown as BodyInit,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck() {
    const response = await fetch(getApiUrl('/health'));
    return response.json();
  }
}

export const apiService = new ApiService();

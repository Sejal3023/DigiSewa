// Frontend/src/services/adminService.ts
import { getApiUrl } from '@/config/api';

class AdminService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

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

  // ==========================================
  // EXISTING METHODS
  // ==========================================

  // Fetch all admins
  async getAdmins() {
    return this.makeRequest('/api/admin/list', { method: 'GET' });
  }

  // Fetch all departments for dropdown
  async getDepartments() {
    return this.makeRequest('/api/departments', { method: 'GET' });
  }

  // Add a new admin
  async addAdmin(data: {
    ethereum_address: string;
    full_name: string;
    role: 'SUPER_ADMIN' | 'DEPT_HEAD' | 'OFFICER';
    department_id: number;
    permissions: string[];
  }) {
    return this.makeRequest('/api/admin/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an existing admin
  async updateAdmin(data: {
    id: number;
    ethereum_address: string;
    full_name: string;
    role: 'SUPER_ADMIN' | 'DEPT_HEAD' | 'OFFICER';
    department_id: number;
    permissions: string[];
  }) {
    return this.makeRequest('/api/admin/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Deactivate an admin
  async deactivateAdmin(id: number) {
    return this.makeRequest(`/api/admin/deactivate/${id}`, {
      method: 'PUT',
    });
  }

  // ==========================================
  // NEW DASHBOARD METHODS
  // ==========================================

  // Dashboard Statistics
  async getDashboardStats() {
    return this.makeRequest('/admin/dashboard/stats', { method: 'GET' });
  }

  // Get Recent Applications
  async getRecentApplications(limit: number = 20) {
    return this.makeRequest(`/admin/applications/recent?limit=${limit}`, { 
      method: 'GET' 
    });
  }

  // Get Application Details
  async getApplicationDetails(applicationId: string) {
    return this.makeRequest(`/admin/applications/${applicationId}`, { 
      method: 'GET' 
    });
  }

  // Approve Application
  async approveApplication(applicationId: string, remarks: string) {
    return this.makeRequest(`/admin/applications/${applicationId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  // Reject Application
  async rejectApplication(applicationId: string, reason: string) {
    return this.makeRequest(`/admin/applications/${applicationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Get Audit Logs
  async getAuditLogs(limit: number = 50, offset: number = 0) {
    return this.makeRequest(`/admin/audit-logs?limit=${limit}&offset=${offset}`, { 
      method: 'GET' 
    });
  }

  // Get All Users
  async getUsers() {
    return this.makeRequest('/admin/users', { method: 'GET' });
  }

  // Toggle User Status
  async toggleUserStatus(userId: number) {
    return this.makeRequest(`/admin/users/${userId}/toggle-status`, {
      method: 'PATCH',
    });
  }

  // Export Applications as CSV
  async exportApplications() {
    const token = this.getAuthToken();
    
    const response = await fetch(getApiUrl('/admin/export/applications'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export applications');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'applications.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  }
} // ✅ THIS CLOSING BRACE CLOSES THE CLASS

export const adminService = new AdminService();

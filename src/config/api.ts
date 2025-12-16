// API Configuration for DigiSewa Frontend
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002',
  ENDPOINTS: {
    // Auth
    PROFILE: '/auth/profile',
    
    // Applications
    APPLICATIONS: '/applications',
    APPLICATION_BY_ID: (id: string) => `/applications/${id}`,
    VERIFY_APPLICATION: (id: string) => `/applications/${id}/verify`,
    ISSUE_LICENSE: (id: string) => `/applications/${id}/issue`,
    REVOKE_LICENSE: (id: string) => `/applications/${id}/revoke`,
    OFFICER_APPLICATIONS: '/officer/applications',
    
    // Documents
    DOCUMENTS: '/documents',
    DOCUMENT_UPLOAD: '/documents/upload',
    DOCUMENT_ACCESS: (cid: string) => `/documents/access/${cid}`,
    DOCUMENT_SHARE: (id: string) => `/documents/${id}/share`,
    DEPARTMENT_DOCUMENTS: '/documents/department',
    
    // Licenses
    LICENSES: '/licenses',
    LICENSE_BY_ID: (id: string) => `/licenses/${id}`,
    VERIFY_LICENSE: (id: string) => `/licenses/${id}/verify`,
    USER_CERTIFICATES: '/licenses/user/certificates',
    DOWNLOAD_LICENSE: (licenseNumber: string) => `/licenses/${licenseNumber}/download`,
    LICENSE_DETAILS: (id: string) => `/licenses/${id}/details`,
    
    // Blockchain
    BLOCKCHAIN_RECORD_ISSUANCE: '/blockchain/recordIssuance',
    BLOCKCHAIN_RECORD_REVOCATION: '/blockchain/recordRevocation',
    BLOCKCHAIN_TX: (txHash: string) => `/blockchain/tx/${txHash}`,
    
    // Health
    HEALTH: '/health'
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

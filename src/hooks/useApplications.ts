import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

export interface Application {
  id: string;
  user_id: string;
  service_type: string;
  applicant_data: Record<string, unknown>;
  status: 'pending' | 'verified' | 'issued' | 'rejected';
  document_hash?: string;
  document_storage_path?: string;
  license_id?: string;
  created_at: string;
  updated_at: string;
}

export const useApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Extend User type to include user_metadata if not already present
  type UserWithMetadata = typeof user & { user_metadata?: { role?: string } };

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
      const userRole = (user as UserWithMetadata).user_metadata?.role || 'citizen';
    try {
      // For officers, get pending applications; for citizens, get their own
      const userRole = (user as UserWithMetadata).user_metadata?.role || 'citizen';
      
      if (userRole === 'officer' || userRole === 'super_admin') {
        const response = await apiService.getOfficerApplications();
        setApplications(response.applications || []);
      } else {
        // For now, we'll need to modify backend to support user's own applications
        // This is a placeholder - backend needs GET /applications/user/:userId endpoint
        setApplications([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createApplication = async (data: {
    license_type: string;
    application_data: Record<string, unknown>;
    documentContentBase64?: string;
    filename?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.createApplication(data);
      await fetchApplications(); // Refresh list
      return response.application;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create application');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyApplication = async (id: string, documentBase64: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.verifyApplication(id, documentBase64);
      await fetchApplications(); // Refresh list
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify application');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const issueApplication = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.issueApplication(id);
      await fetchApplications(); // Refresh list
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue license');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user, fetchApplications]);

  return {
    applications,
    loading,
    error,
    createApplication,
    verifyApplication,
    issueApplication,
    refreshApplications: fetchApplications,
  };
};

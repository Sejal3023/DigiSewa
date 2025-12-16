import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Application {
  id: string;
  service_type: string;
  service_title: string;
  applicant_name: string;
  applicant_email: string;
  applicant_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  created_at: string;
  updated_at: string;
  documents: string[];
  form_data?: any;
  department?: string;
  fees?: number;
}

interface ApplicationContextType {
  applications: Application[];
  addApplication: (application: Omit<Application, 'id' | 'created_at' | 'updated_at'>) => string;
  updateApplicationStatus: (id: string, status: Application['status']) => void;
  getApplicationsByUser: (userId: string) => Application[];
  getApplicationsByStatus: (status: Application['status']) => Application[];
  getAllApplications: () => Application[];
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const useApplications = (): ApplicationContextType => {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error('useApplications must be used within an ApplicationProvider');
  }
  return context;
};

export const ApplicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with some demo applications
  const [applications, setApplications] = useState<Application[]>([
    {
      id: "APP001",
      service_type: "trade_license",
      service_title: "Trade License",
      applicant_name: "Rajesh Kumar",
      applicant_email: "rajesh@example.com",
      applicant_id: "demo-user-1",
      status: "pending",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
      documents: ["business_plan.pdf", "address_proof.pdf"],
      department: "Municipal Corporation",
      fees: 500
    },
    {
      id: "APP002",
      service_type: "food_license",
      service_title: "FSSAI Food License",
      applicant_name: "Priya Sharma",
      applicant_email: "priya@example.com",
      applicant_id: "demo-user-2",
      status: "approved",
      created_at: "2024-01-14T14:20:00Z",
      updated_at: "2024-01-15T09:15:00Z",
      documents: ["food_safety_cert.pdf", "hygiene_cert.pdf"],
      department: "Food & Drug Administration",
      fees: 1000
    },
    {
      id: "APP003",
      service_type: "driving_license",
      service_title: "Driving License",
      applicant_name: "Amit Patel",
      applicant_email: "amit@example.com",
      applicant_id: "demo-user-3",
      status: "rejected",
      created_at: "2024-01-13T11:45:00Z",
      updated_at: "2024-01-14T16:30:00Z",
      documents: ["medical_cert.pdf", "address_proof.pdf"],
      department: "Transport Department",
      fees: 200
    }
  ]);

  const addApplication = (applicationData: Omit<Application, 'id' | 'created_at' | 'updated_at'>): string => {
    const newId = `APP${String(applications.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    
    const newApplication: Application = {
      ...applicationData,
      id: newId,
      created_at: now,
      updated_at: now,
    };

    setApplications(prev => [newApplication, ...prev]);
    
    // Also store in localStorage for persistence
    const storedApps = JSON.parse(localStorage.getItem('demo_applications') || '[]');
    storedApps.unshift(newApplication);
    localStorage.setItem('demo_applications', JSON.stringify(storedApps));
    
    return newId;
  };

  const updateApplicationStatus = (id: string, status: Application['status']) => {
    setApplications(prev => prev.map(app => 
      app.id === id 
        ? { ...app, status, updated_at: new Date().toISOString() }
        : app
    ));
    
    // Update localStorage as well
    const storedApps = JSON.parse(localStorage.getItem('demo_applications') || '[]');
    const updatedApps = storedApps.map((app: Application) => 
      app.id === id 
        ? { ...app, status, updated_at: new Date().toISOString() }
        : app
    );
    localStorage.setItem('demo_applications', JSON.stringify(updatedApps));
  };

  const getApplicationsByUser = (userId: string): Application[] => {
    return applications.filter(app => app.applicant_id === userId);
  };

  const getApplicationsByStatus = (status: Application['status']): Application[] => {
    return applications.filter(app => app.status === status);
  };

  const getAllApplications = (): Application[] => {
    return applications;
  };

  // Load applications from localStorage on mount
  React.useEffect(() => {
    const storedApps = localStorage.getItem('demo_applications');
    if (storedApps) {
      try {
        const parsedApps = JSON.parse(storedApps);
        if (parsedApps.length > applications.length) {
          setApplications(parsedApps);
        }
      } catch (error) {
        console.error('Error loading stored applications:', error);
      }
    }
  }, []);

  const value: ApplicationContextType = {
    applications,
    addApplication,
    updateApplicationStatus,
    getApplicationsByUser,
    getApplicationsByStatus,
    getAllApplications,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export default ApplicationContext;

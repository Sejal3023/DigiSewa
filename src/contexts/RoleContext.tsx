import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'super_admin' | 'admin' | 'officer' | 'citizen';

interface RoleContextType {
  currentRole: UserRole;
  originalRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  resetToOriginalRole: () => void;
  canAccessRole: (role: UserRole) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
  initialRole?: UserRole;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ 
  children, 
  initialRole = 'super_admin' 
}) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);
  const [originalRole] = useState<UserRole>(initialRole);

  const canAccessRole = (role: UserRole): boolean => {
    // Super admin can access all roles
    if (originalRole === 'super_admin') return true;
    
    // Admin can access admin, officer, and citizen
    if (originalRole === 'admin') {
      return ['admin', 'officer', 'citizen'].includes(role);
    }
    
    // Officer can access officer and citizen
    if (originalRole === 'officer') {
      return ['officer', 'citizen'].includes(role);
    }
    
    // Citizen can only access citizen
    return role === 'citizen';
  };

  const resetToOriginalRole = () => {
    setCurrentRole(originalRole);
  };

  const value: RoleContextType = {
    currentRole,
    originalRole,
    setCurrentRole,
    resetToOriginalRole,
    canAccessRole,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export default RoleContext;

import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';

export const useBackendHealth = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    try {
      await apiService.healthCheck();
      setIsOnline(true);
      setLastChecked(new Date());
    } catch (error) {
      setIsOnline(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    lastChecked,
    checkHealth,
  };
};

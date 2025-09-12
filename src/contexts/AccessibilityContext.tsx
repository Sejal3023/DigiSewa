import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  fontSize: 'normal' | 'large' | 'extra-large';
  isHighContrast: boolean;
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize') as 'normal' | 'large' | 'extra-large';
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    
    if (savedFontSize) {
      setFontSizeState(savedFontSize);
    }
    
    setIsHighContrast(savedHighContrast);
  }, []);

  useEffect(() => {
    // Apply font size class to root element
    const root = document.documentElement;
    root.classList.remove('font-normal', 'font-large', 'font-extra-large');
    root.classList.add(`font-${fontSize}`);
    
    // Apply high contrast class
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [fontSize, isHighContrast]);

  const setFontSize = (size: 'normal' | 'large' | 'extra-large') => {
    setFontSizeState(size);
    localStorage.setItem('fontSize', size);
  };

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('highContrast', newValue.toString());
  };

  return (
    <AccessibilityContext.Provider value={{ fontSize, isHighContrast, setFontSize, toggleHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
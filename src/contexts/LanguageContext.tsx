import React, { createContext, useContext, useState, useEffect } from 'react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface LanguageContextType {
  currentLanguage: Language;
  languages: Language[];
  changeLanguage: (code: string) => void;
  t: (key: string) => string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' }
];

// Translation dictionary
const translations: Record<string, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.applications': 'My Applications',
    'nav.track': 'Track Application',
    'nav.help': 'Help & Support',
    'nav.dashboard': 'Dashboard',
    'nav.departments': 'Departments',
    'nav.officers': 'Officers',
    'nav.analytics': 'Analytics',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'auth.profile': 'Profile',
    'hero.title': 'Blockchain-Based Digital Government License & Registration System',
    'hero.subtitle': 'Secure, transparent, and efficient government services with tamper-proof certificates powered by blockchain technology',
    'hero.cta.apply': 'Apply for Services',
    'hero.cta.track': 'Track Application',
    'services.title': 'Comprehensive Government Services',
    'services.subtitle': 'Access all government licenses, permits, and registrations through our unified digital platform',
    'services.viewAll': 'View All Services',
    'features.title': 'Why Choose Our Platform',
    'features.subtitle': 'Experience the future of government services with cutting-edge technology',
    'accessibility.skipToMain': 'Skip to main content',
    'accessibility.fontSize': 'Font Size',
    'accessibility.fontNormal': 'Normal',
    'accessibility.fontLarge': 'Large',
    'accessibility.fontExtraLarge': 'Extra Large',
    'accessibility.contrast': 'High Contrast',
    'language.select': 'Select Language',
    'language.current': 'Current Language'
  },
  hi: {
    'nav.home': 'होम',
    'nav.services': 'सेवाएं',
    'nav.applications': 'मेरे आवेदन',
    'nav.track': 'आवेदन ट्रैक करें',
    'nav.help': 'सहायता और समर्थन',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.departments': 'विभाग',
    'nav.officers': 'अधिकारी',
    'nav.analytics': 'विश्लेषण',
    'auth.login': 'लॉग इन',
    'auth.register': 'पंजीकरण',
    'auth.logout': 'लॉग आउट',
    'auth.profile': 'प्रोफाइल',
    'hero.title': 'ब्लॉकचेन-आधारित डिजिटल सरकारी लाइसेंस और पंजीकरण प्रणाली',
    'hero.subtitle': 'ब्लॉकचेन तकनीक द्वारा संचालित छेड़छाड़-प्रूफ प्रमाणपत्रों के साथ सुरक्षित, पारदर्शी और कुशल सरकारी सेवाएं',
    'hero.cta.apply': 'सेवाओं के लिए आवेदन करें',
    'hero.cta.track': 'आवेदन ट्रैक करें',
    'services.title': 'व्यापक सरकारी सेवाएं',
    'services.subtitle': 'हमारे एकीकृत डिजिटल प्लेटफॉर्म के माध्यम से सभी सरकारी लाइसेंस, परमिट और पंजीकरण तक पहुंचें',
    'services.viewAll': 'सभी सेवाएं देखें',
    'features.title': 'हमारा प्लेटफॉर्म क्यों चुनें',
    'features.subtitle': 'अत्याधुनिक तकनीक के साथ सरकारी सेवाओं के भविष्य का अनुभव करें',
    'accessibility.skipToMain': 'मुख्य सामग्री पर जाएं',
    'accessibility.fontSize': 'फ़ॉन्ट आकार',
    'accessibility.fontNormal': 'सामान्य',
    'accessibility.fontLarge': 'बड़ा',
    'accessibility.fontExtraLarge': 'अतिरिक्त बड़ा',
    'accessibility.contrast': 'उच्च कंट्रास्ट',
    'language.select': 'भाषा चुनें',
    'language.current': 'वर्तमान भाषा'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      const language = languages.find(l => l.code === savedLanguage);
      if (language) {
        setCurrentLanguage(language);
      }
    }
  }, []);

  const changeLanguage = (code: string) => {
    const language = languages.find(l => l.code === code);
    if (language) {
      setCurrentLanguage(language);
      localStorage.setItem('selectedLanguage', code);
      
      // Update HTML lang attribute
      document.documentElement.lang = code;
      
      // Update direction for RTL languages
      if (code === 'ur') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    }
  };

  const t = (key: string): string => {
    const translation = translations[currentLanguage.code]?.[key];
    return translation || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, languages, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
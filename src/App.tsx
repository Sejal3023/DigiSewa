import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "./contexts/RoleContext";
import { ApplicationProvider } from "./contexts/ApplicationContext";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TrackApplication from "./pages/TrackApplication";
import ApplicationForm from "./pages/ApplicationForm";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConnectionTest from "./pages/ConnectionTest";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import ApplicationsList from "./pages/admin/ApplicationsList";
import ApplicationDetails from "./pages/admin/ApplicationDetails";
import UserManagement from "./pages/admin/UserManagement";
import AuditTrail from "./pages/admin/AuditTrail";

import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import HelpSupport from './pages/HelpSupport';
import SewaKendra from "./pages/SewaKendra";
import DocumentView from '@/pages/DocumentView';

// ✅ FIXED Department Imports (singular "Department", not "Departments")
import FoodSafetyDepartment from './pages/Departments/FoodSafetyDepartment';
import LabourDepartment from './pages/Departments/LabourDepartment';
import RTODepartment from './pages/Departments/RTODepartment';
import PoliceDepartment from './pages/Departments/PoliceDepartment';
import RevenueDepartment from './pages/Departments/RevenueDepartment';
import MunicipalDepartment from './pages/Departments/MunicipalDepartment';

import { useEffect } from "react";

const queryClient = new QueryClient();

// Development-only error suppression
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('establish connection') || 
         args[0].includes('content-all.js'))) {
      return;
    }
    originalError.apply(console, args);
  };
}

const App = () => {
  useEffect(() => {
    // Suppress extension errors in console
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args: any[]) => {
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('translate-page') || 
         arg.includes('save-page') ||
         arg.includes('content-all.js') ||
         arg.includes('Could not establish connection') ||
         arg.includes('Receiving end does not exist') ||
         arg.includes('extension'))
      )) {
        return; // Ignore extension errors
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('translate-page') || 
         arg.includes('save-page') ||
         arg.includes('content-all.js') ||
         arg.includes('establish connection') ||
         arg.includes('extension'))
      )) {
        return; // Ignore extension warnings
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleProvider initialRole="officer">
          <ApplicationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
                  <Route path="/services/:serviceId" element={<PrivateRoute><Services /></PrivateRoute>} />
                  <Route path="/apply/:serviceId" element={<PrivateRoute><ApplicationForm /></PrivateRoute>} />
                  <Route path="/applications" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/track" element={<PrivateRoute><TrackApplication /></PrivateRoute>} />
                  <Route path="/track/:id" element={<PrivateRoute><TrackApplication /></PrivateRoute>} />
                  <Route path="/connection-test" element={<ConnectionTest />} />
                  <Route path="/admin/admin-dashboard" element={<AdminDashboard />} />
                  {/* ✅ NEW ADMIN ROUTES */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/applications" element={<PrivateRoute><ApplicationsList /></PrivateRoute>} />
                  <Route path="/admin/applications/:id" element={<PrivateRoute><ApplicationDetails /></PrivateRoute>} />
                  <Route path="/admin/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
                  <Route path="/admin/audit" element={<PrivateRoute><AuditTrail /></PrivateRoute>} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />

                  <Route path="/sewa-kendra" element={<SewaKendra />} />
                  <Route path="/help-support" element={<HelpSupport />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

                  {/* ✅ ADDED Department Routes */}
                  <Route path="/departments/food-safety" element={<PrivateRoute><FoodSafetyDepartment /></PrivateRoute>} />
                  <Route path="/departments/labour" element={<PrivateRoute><LabourDepartment /></PrivateRoute>} />
                  <Route path="/departments/rto" element={<PrivateRoute><RTODepartment /></PrivateRoute>} />
                  <Route path="/departments/police" element={<PrivateRoute><PoliceDepartment /></PrivateRoute>} />
                  <Route path="/departments/revenue" element={<PrivateRoute><RevenueDepartment /></PrivateRoute>} />
                  <Route path="/departments/municipal" element={<PrivateRoute><MunicipalDepartment /></PrivateRoute>} />
                  <Route path="/documents/:id" element={<DocumentView />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ApplicationProvider>
        </RoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
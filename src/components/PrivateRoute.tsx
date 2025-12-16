import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  
  // ✅ Check multiple token locations (officers store token differently)
  const token = localStorage.getItem('token') || 
                localStorage.getItem('auth_token') || 
                localStorage.getItem('adminToken') ||
                sessionStorage.getItem('token');
  
  // ✅ Allow access if EITHER user exists OR token exists
  return (user || token) ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;

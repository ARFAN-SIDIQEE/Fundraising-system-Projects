// frontend/src/router/guards.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Redirect logged-in users away from login/register
export function RedirectIfUser({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === "claimer" ? "/claimer" : "/donor"} replace />;
  return children;
}

// Redirect logged-in admin away from admin/login
export function RedirectIfAdmin({ children }) {
  const { adminToken } = useAuth();
  const token = adminToken || localStorage.getItem("fs_admin_token");
  if (token) return <Navigate to="/admin" replace />;
  return children;
}

// Guard for claimer/donor pages
export function ProtectedUser({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

// Guard for admin pages — checks state AND localStorage
export function ProtectedAdmin({ children }) {
  const { adminToken } = useAuth();
  const token = adminToken || localStorage.getItem("fs_admin_token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

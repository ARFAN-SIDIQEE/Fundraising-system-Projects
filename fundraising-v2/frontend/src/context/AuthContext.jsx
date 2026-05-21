// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ── State-backed so React re-renders when they change ──────────────────────
  const [user,       setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("fs_user") || "null"); } catch { return null; }
  });
  const [admin,      setAdmin]      = useState(() => {
    try { return JSON.parse(localStorage.getItem("fs_admin") || "null"); } catch { return null; }
  });
  const [userToken,  setUserToken]  = useState(() => localStorage.getItem("fs_user_token")  || null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("fs_admin_token") || null);

  // loginUser
  const loginUser = (userData, tokenData) => {
    setUser(userData);
    setUserToken(tokenData);
    localStorage.setItem("fs_user",       JSON.stringify(userData));
    localStorage.setItem("fs_user_token", tokenData);
  };

  // loginAdmin — saves BOTH state and localStorage
  const loginAdmin = (adminData, tokenData) => {
    setAdmin(adminData);
    setAdminToken(tokenData);
    localStorage.setItem("fs_admin",       JSON.stringify(adminData));
    localStorage.setItem("fs_admin_token", tokenData);
  };

  const logoutUser = () => {
    setUser(null);
    setUserToken(null);
    localStorage.removeItem("fs_user");
    localStorage.removeItem("fs_user_token");
  };

  const logoutAdmin = () => {
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem("fs_admin");
    localStorage.removeItem("fs_admin_token");
  };

  return (
    <AuthContext.Provider value={{
      user, admin,
      token:      adminToken || userToken,
      userToken,
      adminToken,
      loginUser, loginAdmin,
      logoutUser, logoutAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

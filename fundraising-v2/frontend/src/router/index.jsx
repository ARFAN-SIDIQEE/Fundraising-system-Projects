// frontend/src/router/index.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import RootLayout    from "../layouts/RootLayout";
import PublicLayout  from "../layouts/PublicLayout";
import AdminLayout   from "../layouts/AdminLayout";

// Pages
import Home             from "../pages/Home";
import Login            from "../pages/Login";
import Register         from "../pages/Register";
import Terms            from "../pages/Terms";
import ClaimerDashboard from "../pages/claimer/ClaimerDashboard";
import DonorDashboard   from "../pages/donor/DonorDashboard";
import AdminLogin       from "../pages/admin/AdminLogin";
import AdminDashboard   from "../pages/admin/AdminDashboard";

// Guards
import { ProtectedUser, ProtectedAdmin, RedirectIfUser, RedirectIfAdmin } from "./guards";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // ── Public pages with Navbar ──────────────────────────
      {
        element: <PublicLayout />,
        children: [
          { index: true,   element: <Home /> },
          { path: "terms", element: <Terms /> },
          {
            path: "login",
            element: <RedirectIfUser><Login /></RedirectIfUser>,
          },
          {
            path: "register",
            element: <RedirectIfUser><Register /></RedirectIfUser>,
          },
        ],
      },

      // ── User Dashboards ───────────────────────────────────
      {
        path: "claimer",
        element: <ProtectedUser role="claimer"><ClaimerDashboard /></ProtectedUser>,
      },
      {
        path: "donor",
        element: <ProtectedUser role="donor"><DonorDashboard /></ProtectedUser>,
      },

      // ── Admin ─────────────────────────────────────────────
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          {
            path: "login",
            element: <RedirectIfAdmin><AdminLogin /></RedirectIfAdmin>,
          },
          {
            index: true,
            element: <ProtectedAdmin><AdminDashboard /></ProtectedAdmin>,
          },
        ],
      },

      // ── Catch-all ─────────────────────────────────────────
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;

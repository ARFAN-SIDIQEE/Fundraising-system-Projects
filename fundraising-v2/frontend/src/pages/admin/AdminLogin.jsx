// frontend/src/pages/admin/AdminLogin.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginAdmin as apiLoginAdmin } from "../../services/api";
import { FiMail, FiLock, FiLogIn, FiAlertCircle } from "react-icons/fi";

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email:"admin@fundraising.com", password:"" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      const data = await apiLoginAdmin(form);
      if (!data.admin || !data.token) throw new Error("Invalid server response");

      // 1. Save to context state + localStorage
      loginAdmin(data.admin, data.token);

      // 2. Also write directly to localStorage as backup
      localStorage.setItem("fs_admin",       JSON.stringify(data.admin));
      localStorage.setItem("fs_admin_token", data.token);

      // 3. Navigate
      navigate("/admin", { replace: true });
    } catch(err) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-4 px-3"
      style={{ background:"linear-gradient(135deg,#1a6b4a,#0a3d2b)" }}>
      <div className="w-100" style={{ maxWidth:420 }}>
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">

          {/* Header */}
          <div className="text-center text-white py-4" style={{ background:"rgba(0,0,0,0.2)" }}>
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width:72, height:72, background:"rgba(255,255,255,0.15)", fontSize:"2rem" }}>🔒</div>
            <h3 className="fw-bold mb-1">Admin Portal</h3>
            <p className="opacity-75 small mb-0">Secure access to Fundraising Dashboard</p>
          </div>

          {/* Body */}
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2">
                <FiAlertCircle/> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text"><FiMail className="text-muted"/></span>
                  <input className="form-control" type="email"
                    value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                    placeholder="admin@fundraising.com" autoComplete="username" required/>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Password</label>
                <div className="input-group">
                  <span className="input-group-text"><FiLock className="text-muted"/></span>
                  <input className="form-control" type="password"
                    value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                    placeholder="Enter your password" autoComplete="current-password" required/>
                </div>
              </div>

              <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2"/>Signing in...</>
                  : <><FiLogIn className="me-2"/>Sign In</>}
              </button>
            </form>

           
          </div>
        </div>
      </div>
    </div>
  );
}

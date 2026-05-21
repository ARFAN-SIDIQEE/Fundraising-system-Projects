// frontend/src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser as apiLogin } from "../services/api";
import { FiMail, FiLock, FiLogIn, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email:"", password:"", role:"" });
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email||!form.password||!form.role) { setAlert({type:"danger",msg:"All fields are required!"}); return; }
    setLoading(true); setAlert(null);
    try {
      const data = await apiLogin(form);
      loginUser(data.user, data.token);
      setAlert({type:"success",msg:"Login successful! Redirecting..."});
      setTimeout(()=>navigate(form.role==="claimer"?"/claimer":"/donor"),800);
    } catch(err) {
      setAlert({type:"danger",msg:err.message});
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-4 px-3"
      style={{ background:"linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
      <div className="w-100" style={{ maxWidth:440 }}>
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="text-center text-white py-4 px-4" style={{ background:"linear-gradient(135deg,#1a6b4a,#0f4a32)" }}>
            <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width:64, height:64, fontSize:"1.8rem" }}>🔐</div>
            <h3 className="fw-bold mb-1">User Login</h3>
            <p className="opacity-75 small mb-0">Sign in to your account</p>
          </div>
          <div className="card-body p-4">
            {alert && (
              <div className={`alert alert-${alert.type} d-flex align-items-center gap-2 py-2`}>
                {alert.type==="success"?<FiCheckCircle/>:<FiAlertCircle/>} {alert.msg}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><FiMail className="text-muted"/></span>
                  <input className="form-control" type="email" placeholder="Enter your email"
                    value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><FiLock className="text-muted"/></span>
                  <input className="form-control" type="password" placeholder="Enter your password"
                    value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Login As</label>
                <select className="form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} required>
                  <option value="">Select Role</option>
                  <option value="claimer">🎓 Student (Claimer)</option>
                  <option value="donor">💝 Donor</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2"/>Signing in...</>
                  : <><FiLogIn className="me-2"/>Login</>}
              </button>
            </form>
            <hr className="my-3"/>
            <p className="text-center text-muted small mb-1">
              Don't have an account? <Link to="/register" className="fw-semibold" style={{color:"#1a6b4a"}}>Register here</Link>
            </p>
           
          </div>
        </div>
      </div>
    </div>
  );
}

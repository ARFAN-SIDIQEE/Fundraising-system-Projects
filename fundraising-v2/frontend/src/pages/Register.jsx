// frontend/src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/api";
import { FiUser, FiMail, FiLock, FiUserPlus, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function Register() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name:"", email:"", password:"", role:"" });
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name||!form.email||!form.password||!form.role) { setAlert({type:"danger",msg:"All fields are required!"}); return; }
    if (form.password.length<6) { setAlert({type:"danger",msg:"Password must be at least 6 characters!"}); return; }
    setLoading(true); setAlert(null);
    try {
      const data = await registerUser(form);
      loginUser(data.user, data.token);
      setAlert({type:"success",msg:"Registered successfully! Redirecting..."});
      setTimeout(()=>navigate(form.role==="claimer"?"/claimer":"/donor"),800);
    } catch(err) {
      setAlert({type:"danger",msg:err.message});
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-4 px-3"
      style={{ background:"linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
      <div className="w-100" style={{ maxWidth:460 }}>
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="text-center text-white py-4 px-4" style={{ background:"linear-gradient(135deg,#1a6b4a,#0f4a32)" }}>
            <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width:64, height:64, fontSize:"1.8rem" }}>✍️</div>
            <h3 className="fw-bold mb-1">Create Account</h3>
            <p className="opacity-75 small mb-0">Join the fundraising community</p>
          </div>
          <div className="card-body p-4">
            {alert && (
              <div className={`alert alert-${alert.type} d-flex align-items-center gap-2 py-2`}>
                {alert.type==="success"?<FiCheckCircle/>:<FiAlertCircle/>} {alert.msg}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><FiUser className="text-muted"/></span>
                  <input className="form-control" placeholder="Your full name"
                    value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                </div>
              </div>
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
                  <input className="form-control" type="password" placeholder="Minimum 6 characters"
                    value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Register As</label>
                <select className="form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} required>
                  <option value="">Select Role</option>
                  <option value="claimer">🎓 Student (Claimer)</option>
                  <option value="donor">💝 Donor</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2"/>Creating account...</>
                  : <><FiUserPlus className="me-2"/>Create Account</>}
              </button>
            </form>
            <hr className="my-3"/>
            <p className="text-center text-muted small mb-0">
              Already have an account? <Link to="/login" className="fw-semibold" style={{color:"#1a6b4a"}}>Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

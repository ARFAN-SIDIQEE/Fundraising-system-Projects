// frontend/src/pages/claimer/ClaimerDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { submitClaim, getMyClaims, getClaimerMessages } from "../../services/api";
import {
  FiFileText, FiList, FiMail, FiLogOut, FiMenu, FiX,
  FiSend, FiAlertCircle, FiCheckCircle, FiClock, FiXCircle,
  FiUser, FiDollarSign, FiBookOpen, FiPhone,
} from "react-icons/fi";
import { GiGraduateCap } from "react-icons/gi";

const DEPARTMENTS = [
  "Computer Science","Software Engineering","Electrical Engineering",
  "Mechanical Engineering","Civil Engineering","Business Administration",
  "Mathematics","Physics","Chemistry","Biology",
];
const SEMESTERS = [
  {v:"1",l:"1st"},{v:"2",l:"2nd"},{v:"3",l:"3rd"},{v:"4",l:"4th"},
  {v:"5",l:"5th"},{v:"6",l:"6th"},{v:"7",l:"7th"},{v:"8",l:"8th"},
];

const NAV = [
  { key:"submit-claim", label:"Submit Claim", Icon: FiFileText },
  { key:"my-claims",    label:"My Claims",    Icon: FiList     },
  { key:"messages",     label:"Messages",     Icon: FiMail     },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SidebarContent({ active, setActive, user, onLogout, onClose }) {
  return (
    <div className="d-flex flex-column h-100" style={{
      background: "linear-gradient(180deg,#1a6b4a 0%,#0f4a32 100%)", minHeight:"100vh"
    }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between px-3 py-4"
        style={{ borderBottom:"1px solid rgba(255,255,255,0.12)" }}>
        <div className="d-flex align-items-center gap-2 text-white fw-bold">
          <GiGraduateCap size={22}/>
          <div>
            <div style={{fontSize:"0.95rem"}}>Fundraising</div>
            <div style={{fontSize:"0.68rem",opacity:0.6,fontWeight:400}}>Student Dashboard</div>
          </div>
        </div>
        {onClose && (
          <button className="btn btn-sm p-0 text-white" style={{background:"transparent",border:"none"}}
            onClick={onClose}><FiX size={20}/></button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-grow-1 py-2">
        {NAV.map(({key,label,Icon})=>(
          <button key={key} onClick={()=>{ setActive(key); onClose?.(); }}
            className="btn w-100 text-start d-flex align-items-center gap-2 px-3 py-2 rounded-0"
            style={{
              color: active===key?"#fff":"rgba(255,255,255,0.72)",
              background: active===key?"rgba(255,255,255,0.18)":"transparent",
              fontWeight: active===key?600:400, fontSize:"0.855rem",
              borderLeft: active===key?"3px solid #fff":"3px solid transparent",
              border:"none", borderRadius:0, transition:"all 0.15s",
            }}>
            <Icon size={15}/>{label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3" style={{borderTop:"1px solid rgba(255,255,255,0.12)"}}>
        <div className="text-white mb-2 d-flex align-items-center gap-2" style={{fontSize:"0.75rem",opacity:0.7}}>
          <FiUser size={13}/>
          <div>
            <div className="fw-semibold" style={{opacity:0.9}}>{user?.name}</div>
            <div style={{fontSize:"0.68rem"}}>{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
          onClick={onLogout}><FiLogOut size={13}/>Logout</button>
      </div>
    </div>
  );
}

// ── Dashboard Shell ───────────────────────────────────────────────────────────
export default function ClaimerDashboard() {
  const { user, userToken, logoutUser } = useAuth();
  const token = userToken || localStorage.getItem("fs_user_token");
  const navigate = useNavigate();
  const [active, setActive]     = useState("submit-claim");
  const [sideOpen, setSideOpen] = useState(false);

  const handleLogout = () => { logoutUser(); navigate("/"); };
  const currentSection = NAV.find(n=>n.key===active);

  return (
    <div className="d-flex" style={{ minHeight:"100vh", background:"#f1f5f9" }}>

      {/* Desktop sidebar */}
      <div className="d-none d-lg-flex flex-column"
        style={{ width:230, minHeight:"100vh", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>
        <SidebarContent active={active} setActive={setActive} user={user} onLogout={handleLogout}/>
      </div>

      {/* Mobile overlay */}
      {sideOpen && (
        <div className="d-lg-none" style={{position:"fixed",inset:0,zIndex:1040}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}}
            onClick={()=>setSideOpen(false)}/>
          <div style={{position:"absolute",left:0,top:0,width:250,height:"100vh",
            zIndex:1050,overflowY:"auto",boxShadow:"4px 0 20px rgba(0,0,0,0.3)"}}>
            <SidebarContent active={active} setActive={setActive} user={user}
              onLogout={handleLogout} onClose={()=>setSideOpen(false)}/>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-grow-1" style={{minWidth:0}}>

        {/* Mobile top bar */}
        <div className="d-lg-none d-flex align-items-center gap-3 px-3 py-2 text-white sticky-top"
          style={{background:"#1a6b4a",zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
          <button className="btn btn-sm p-1 text-white" style={{background:"transparent",border:"none"}}
            onClick={()=>setSideOpen(true)}><FiMenu size={22}/></button>
          <div className="d-flex align-items-center gap-2">
            {currentSection && <currentSection.Icon size={16}/>}
            <span className="fw-semibold" style={{fontSize:"0.9rem"}}>{currentSection?.label}</span>
          </div>
        </div>

        <div className="p-3 p-md-4">
          {active==="submit-claim" && <SubmitClaimSection user={user} token={token}/>}
          {active==="my-claims"    && <MyClaimsSection    user={user} token={token}/>}
          {active==="messages"     && <MessagesSection    token={token}/>}
        </div>
      </div>
    </div>
  );
}

// ── Submit Claim ──────────────────────────────────────────────────────────────
function SubmitClaimSection({ user, token }) {
  const [form, setForm] = useState({
    claimer_name:user?.name||"", amount:"", department:"",
    semester:"", description:"", hod_no:"", easypaisa_no:""
  });
  const [hodFile, setHodFile] = useState(null);
  const [alert, setAlert]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({...form,[e.target.name]:e.target.value});
  const readFile = f => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=()=>rej(new Error("File read failed")); r.readAsDataURL(f); });

  const handleSubmit = async e => {
    e.preventDefault();
    if(!hodFile){ setAlert({type:"danger",msg:"HOD approved document is required!"}); return; }
    setLoading(true); setAlert(null);
    try {
      const fileData = await readFile(hodFile);
      await submitClaim({
        ...form, user_id:user.id,
        amount:parseFloat(form.amount), semester:parseInt(form.semester),
        hod_file_name:hodFile.name, hod_file_type:hodFile.type, hod_file_data:fileData,
      }, token);
      setAlert({type:"success",msg:"✅ Claim submitted successfully! Admin will review it soon."});
      setForm({claimer_name:user?.name||"",amount:"",department:"",semester:"",description:"",hod_no:"",easypaisa_no:""});
      setHodFile(null);
    } catch(err) {
      setAlert({type:"danger",msg:err.message});
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold d-flex align-items-center gap-2" style={{color:"#1a6b4a"}}>
          <FiFileText/> Submit Claim
        </h4>
        <p className="text-muted small mb-0">Fill the form below to request financial assistance</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} d-flex align-items-center gap-2`} role="alert">
          {alert.type==="success"?<FiCheckCircle/>:<FiAlertCircle/>}
          {alert.msg}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-3" style={{maxWidth:680}}>
        <div className="card-body p-3 p-md-4">
          <form onSubmit={handleSubmit}>

            <div className="mb-3">
              <label className="form-label fw-semibold small"><FiUser size={13} className="me-1"/>Full Name</label>
              <input className="form-control" name="claimer_name" value={form.claimer_name} onChange={handleChange} required/>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold small"><FiDollarSign size={13} className="me-1"/>Amount (PKR)</label>
                <input className="form-control" type="number" name="amount" min="100" placeholder="e.g. 5000" value={form.amount} onChange={handleChange} required/>
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold small"><FiBookOpen size={13} className="me-1"/>Semester</label>
                <select className="form-select" name="semester" value={form.semester} onChange={handleChange} required>
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(s=><option key={s.v} value={s.v}>{s.l} Semester</option>)}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold small">Department</label>
              <select className="form-select" name="department" value={form.department} onChange={handleChange} required>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold small">Description</label>
              <textarea className="form-control" name="description" rows={4}
                placeholder="Describe why you need financial assistance..."
                value={form.description} onChange={handleChange} required/>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold small">
                HOD Approved Document <span className="text-danger">*</span>
              </label>
              <input className="form-control" type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                onChange={e=>setHodFile(e.target.files[0])} required/>
              {hodFile && (
                <div className="mt-2 d-flex align-items-center gap-2 text-success small">
                  <FiCheckCircle/> {hodFile.name}
                </div>
              )}
              <div className="form-text">Upload HOD signed approval (PDF or Image)</div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold small"><FiPhone size={13} className="me-1"/>HOD No <span className="text-muted fw-normal">(optional)</span></label>
                <input className="form-control" name="hod_no" placeholder="HOD contact number" value={form.hod_no} onChange={handleChange}/>
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold small"><FiPhone size={13} className="me-1"/>Your EasyPaisa No <span className="text-danger">*</span></label>
                <input className="form-control" name="easypaisa_no" placeholder="03XX-XXXXXXX" value={form.easypaisa_no} onChange={handleChange} required/>
                <div className="form-text">Donors will send money to this number</div>
              </div>
            </div>

            <button type="submit" className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm"/>Submitting...</>
                : <><FiSend/>Submit Claim</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── My Claims ─────────────────────────────────────────────────────────────────
function MyClaimsSection({ user, token }) {
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(()=>{
    getMyClaims(user?.id,token)
      .then(d=>setClaims(Array.isArray(d)?d:[]))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  },[]);

  const StatusBadge = ({s}) => {
    const map = {
      pending:  ["warning","text-dark",<FiClock size={11}/>,"Pending"],
      approved: ["success","",<FiCheckCircle size={11}/>,"Approved"],
      rejected: ["danger","",<FiXCircle size={11}/>,"Rejected"],
    };
    const [bg,tc,icon,label] = map[s]||["secondary","",null,s];
    return <span className={`badge bg-${bg} ${tc} d-inline-flex align-items-center gap-1`}>{icon}{label}</span>;
  };

  const counts = {
    pending:  claims.filter(c=>c.status==="pending").length,
    approved: claims.filter(c=>c.status==="approved").length,
    rejected: claims.filter(c=>c.status==="rejected").length,
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold d-flex align-items-center gap-2" style={{color:"#1a6b4a"}}>
          <FiList/>My Claims History
        </h4>
        <p className="text-muted small mb-0">Track the status of your submitted claims</p>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        {[["Total",claims.length,"success","📋"],["Pending",counts.pending,"warning","⏳"],
          ["Approved",counts.approved,"primary","✅"],["Rejected",counts.rejected,"danger","❌"]].map(([l,v,c,em])=>(
          <div key={l} className="col-6 col-md-3">
            <div className={`card border-0 shadow-sm text-center border-top border-${c} border-3 rounded-3`}>
              <div className="card-body py-3">
                <div style={{fontSize:"1.4rem"}}>{em}</div>
                <div className="text-muted small mt-1">{l}</div>
                <div className={`fw-bold fs-4 text-${c}`}>{v}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-danger d-flex align-items-center gap-2"><FiAlertCircle/>{error}</div>}
      {loading
        ? <div className="text-center py-5"><div className="spinner-border text-success"/></div>
        : claims.length===0
          ? (
            <div className="text-center py-5 text-muted">
              <FiList size={48} className="mb-3 d-block mx-auto opacity-25"/>
              <h5>No claims submitted yet</h5>
              <p className="small">Submit your first claim using the form</p>
            </div>
          )
          : (
            <div className="card border-0 shadow-sm rounded-3">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{background:"#1a6b4a",color:"#fff"}}>
                    <tr>
                      <th className="py-3 px-3">#ID</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3 d-none d-md-table-cell">Department</th>
                      <th className="py-3 px-3 d-none d-sm-table-cell">Semester</th>
                      <th className="py-3 px-3 d-none d-lg-table-cell">Submitted</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map(c=>(
                      <tr key={c.id}>
                        <td className="px-3 small fw-semibold">#{c.id}</td>
                        <td className="px-3 small">PKR {parseFloat(c.amount).toLocaleString()}</td>
                        <td className="px-3 small d-none d-md-table-cell">{c.department}</td>
                        <td className="px-3 small d-none d-sm-table-cell">
                          {c.semester?`${c.semester}${["st","nd","rd","th","th","th","th","th"][c.semester-1]} Sem`:"—"}
                        </td>
                        <td className="px-3 small d-none d-lg-table-cell">{new Date(c.date_submitted).toLocaleDateString()}</td>
                        <td className="px-3"><StatusBadge s={c.status}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
      }
    </div>
  );
}

// ── Messages ──────────────────────────────────────────────────────────────────
function MessagesSection({ token }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(()=>{
    getClaimerMessages(token)
      .then(d=>setMessages(Array.isArray(d)?d:[]))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  },[]);

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold d-flex align-items-center gap-2" style={{color:"#1a6b4a"}}>
          <FiMail/>Messages from Admin
        </h4>
        <p className="text-muted small mb-0">Only messages sent after your registration are shown here</p>
      </div>

      {error && <div className="alert alert-danger d-flex align-items-center gap-2"><FiAlertCircle/>{error}</div>}

      {loading
        ? <div className="text-center py-5"><div className="spinner-border text-success"/></div>
        : messages.length===0
          ? (
            <div className="text-center py-5 text-muted">
              <FiMail size={52} className="mb-3 d-block mx-auto opacity-25"/>
              <h5>No Messages Yet</h5>
              <p className="small">Admin messages sent after your registration will appear here</p>
            </div>
          )
          : messages.map(m=>(
            <div key={m.id} className="card border-0 shadow-sm mb-3 rounded-3 border-start border-success border-3">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-success">📢 Admin</span>
                    <h6 className="fw-bold mb-0">{m.subject}</h6>
                  </div>
                  <small className="text-muted d-flex align-items-center gap-1">
                    <FiClock size={11}/>{new Date(m.date_sent).toLocaleString()}
                  </small>
                </div>
                <p className="mb-0 text-secondary small" style={{lineHeight:1.7,whiteSpace:"pre-wrap"}}>{m.content}</p>
              </div>
            </div>
          ))
      }
    </div>
  );
}

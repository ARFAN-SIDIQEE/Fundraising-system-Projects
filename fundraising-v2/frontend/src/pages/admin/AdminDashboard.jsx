// frontend/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getAllClaims, getPendingClaims, getClaimById, updateClaimStatus, deleteClaim,
  getAllUsers, deleteUser,
  getAllDonations, getDonationStats, verifyDonation, rejectDonation, deleteDonation,
  getAllMessages, sendMessage, deleteMessage,
  getSystemStats, getDepartments, addDepartment, updateDepartment, deleteDepartment,
  getPaymentInfo, savePaymentInfo,
} from "../../services/api";
import {
  FiClock, FiList, FiUsers, FiMail, FiDollarSign,
  FiBarChart2, FiPhone, FiCreditCard, FiLogOut, FiMenu, FiX,
  FiEye, FiCheck, FiTrash2, FiEdit, FiPlus, FiSend, FiAlertCircle,
  FiChevronRight,
} from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";

const SECTIONS = [
  { key: "pending-claims",      label: "Pending Claims",    Icon: FiClock },
  { key: "all-claims",          label: "All Claims",        Icon: FiList },
  { key: "manage-users",        label: "Manage Users",      Icon: FiUsers },
  { key: "send-message",        label: "Send Messages",     Icon: FiMail },
  { key: "donation-management", label: "Donations",         Icon: FiDollarSign },
  { key: "system-stats",        label: "Statistics",        Icon: FiBarChart2 },
  { key: "department-contact",  label: "Departments",       Icon: FiPhone },
  { key: "payment-info",        label: "Payment Settings",  Icon: FiCreditCard },
];

// ── Shared helpers ────────────────────────────────────────────────────────────
const PageHeader = ({ title, sub, children }) => (
  <div className="d-flex justify-content-between align-items-start align-items-md-center mb-4 flex-wrap gap-3">
    <div>
      <h4 className="fw-bold mb-1" style={{ color: "#1a6b4a" }}>{title}</h4>
      {sub && <p className="text-muted small mb-0">{sub}</p>}
    </div>
    {children && <div>{children}</div>}
  </div>
);

const Badge = ({ status }) => {
  const map = {
    pending:  ["warning",  "text-dark", "⏳ Pending"],
    approved: ["success",  "",          "✅ Approved"],
    rejected: ["danger",   "",          "❌ Rejected"],
    verified: ["primary",  "",          "✔ Verified"],
  };
  const [bg, tc, label] = map[status] || ["secondary", "", status];
  return <span className={`badge bg-${bg} ${tc}`}>{label}</span>;
};

function Modal({ show, onClose, title, children, size = "" }) {
  if (!show) return null;
  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,0.55)", zIndex: 1055 }} onClick={onClose}>
      <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Alrt({ type, msg }) {
  if (!msg) return null;
  return <div className={`alert alert-${type} d-flex align-items-center gap-2 py-2`}><FiAlertCircle size={15}/>{msg}</div>;
}

// ── Sidebar content (shared between desktop + mobile) ─────────────────────────
function SidebarContent({ active, setActive, admin, onLogout, onClose }) {
  return (
    <div className="d-flex flex-column h-100" style={{
      background: "linear-gradient(180deg,#1a6b4a 0%,#0f4a32 100%)", minHeight: "100vh",
    }}>
      {/* Logo */}
      <div className="d-flex align-items-center justify-content-between px-3 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="d-flex align-items-center gap-2 text-white fw-bold">
          <MdAdminPanelSettings size={22} />
          <div>
            <div style={{ fontSize: "0.95rem" }}>Admin Panel</div>
            <div style={{ fontSize: "0.68rem", opacity: 0.6, fontWeight: 400 }}>Fundraising System</div>
          </div>
        </div>
        {onClose && (
          <button className="btn btn-sm p-0 text-white" style={{ background: "transparent", border: "none" }}
            onClick={onClose}><FiX size={20} /></button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-grow-1 py-2" style={{ overflowY: "auto" }}>
        {SECTIONS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => { setActive(key); onClose?.(); }}
            className="btn w-100 text-start d-flex align-items-center gap-2 px-3 py-2 my-px rounded-0"
            style={{
              color: active === key ? "#fff" : "rgba(255,255,255,0.72)",
              background: active === key ? "rgba(255,255,255,0.18)" : "transparent",
              fontWeight: active === key ? 600 : 400,
              fontSize: "0.855rem",
              borderLeft: active === key ? "3px solid #fff" : "3px solid transparent",
              border: "none", borderRadius: 0, transition: "all 0.15s",
            }}>
            <Icon size={15} />{label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="text-white mb-2" style={{ fontSize: "0.75rem", opacity: 0.6 }}>
          <div className="fw-semibold" style={{ opacity: 0.9 }}>{admin?.name || "Admin"}</div>
          <div>{admin?.email}</div>
        </div>
        <button className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
          onClick={onLogout}><FiLogOut size={13} /> Logout</button>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { admin, adminToken, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [active, setActive]     = useState("pending-claims");
  const [sideOpen, setSideOpen] = useState(false);

  const token = adminToken || localStorage.getItem("fs_admin_token");
  const handleLogout = () => { logoutAdmin(); navigate("/admin/login", { replace: true }); };
  const currentSection = SECTIONS.find(s => s.key === active);

  return (
    <div className="d-flex" style={{ minHeight: "100vh", background: "#f1f5f9" }}>

      {/* ── Desktop sidebar (≥992px) ── */}
      <div className="d-none d-lg-flex flex-column"
        style={{ width: 230, minHeight: "100vh", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <SidebarContent active={active} setActive={setActive} admin={admin} onLogout={handleLogout} />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sideOpen && (
        <div className="d-lg-none" style={{ position: "fixed", inset: 0, zIndex: 1040 }}>
          {/* Backdrop */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
            onClick={() => setSideOpen(false)} />
          {/* Drawer */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 250, height: "100vh",
            zIndex: 1050, overflowY: "auto", boxShadow: "4px 0 20px rgba(0,0,0,0.3)" }}>
            <SidebarContent active={active} setActive={setActive} admin={admin}
              onLogout={handleLogout} onClose={() => setSideOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex-grow-1" style={{ minWidth: 0 }}>

        {/* Mobile top bar */}
        <div className="d-lg-none d-flex align-items-center gap-3 px-3 py-2 text-white sticky-top"
          style={{ background: "#1a6b4a", zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          <button className="btn btn-sm p-1 text-white" style={{ background: "transparent", border: "none" }}
            onClick={() => setSideOpen(true)}>
            <FiMenu size={22} />
          </button>
          <div className="d-flex align-items-center gap-2">
            {currentSection && <currentSection.Icon size={16} />}
            <span className="fw-semibold" style={{ fontSize: "0.9rem" }}>
              {currentSection?.label || "Admin"}
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="p-3 p-md-4">
          {active === "pending-claims"      && <PendingClaimsSection      token={token} />}
          {active === "all-claims"          && <AllClaimsSection          token={token} />}
          {active === "manage-users"        && <ManageUsersSection        token={token} />}
          {active === "send-message"        && <SendMessageSection        token={token} />}
          {active === "donation-management" && <DonationMgmtSection       token={token} />}
          {active === "system-stats"        && <SystemStatsSection        token={token} />}
          {active === "department-contact"  && <DeptContactSection        token={token} />}
          {active === "payment-info"        && <PaymentInfoSection        token={token} />}
        </div>
      </div>
    </div>
  );
}

// ── 1. Pending Claims ─────────────────────────────────────────────────────────
function PendingClaimsSection({ token }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail]   = useState(null);
  const [msg, setMsg]         = useState(null);

  const load = () => { setLoading(true); getPendingClaims(token).then(d => setClaims(Array.isArray(d)?d:[])).catch(e=>setMsg({t:"danger",m:e.message})).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const act = async (id, status) => {
    try { await updateClaimStatus(id, status, token); setDetail(null); load(); setMsg({t:"success",m:`Claim ${status}!`}); }
    catch(e){ setMsg({t:"danger",m:e.message}); }
  };
  const view = async (id) => { try { setDetail(await getClaimById(id,token)); } catch(e){ setMsg({t:"danger",m:e.message}); }};

  return (
    <div>
      <PageHeader title="⏳ Pending Claims" sub="Review student claims and approve or reject" />
      <Alrt type={msg?.t} msg={msg?.m} />
      {loading
        ? <div className="text-center py-5"><div className="spinner-border text-success" /></div>
        : claims.length === 0
          ? <div className="text-center py-5 text-muted"><FiClock size={48} className="mb-3 opacity-25 d-block mx-auto"/><h5>No pending claims</h5></div>
          : claims.map(c => (
            <div key={c.id} className="card border-0 shadow-sm mb-3 rounded-3" style={{ borderLeft:"4px solid #f59e0b" }}>
              <div className="card-body p-3">
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md-8">
                    <h6 className="fw-bold text-success mb-1">Claim #{c.id} — {c.claimer_name}</h6>
                    <p className="mb-1 small"><strong>PKR {parseFloat(c.amount).toLocaleString()}</strong> · {c.department} · Sem {c.semester||"—"}</p>
                    <p className="text-muted small mb-0">{new Date(c.date_submitted).toLocaleString()}</p>
                  </div>
                  <div className="col-12 col-md-4 d-flex gap-2 justify-content-md-end flex-wrap">
                    <button className="btn btn-outline-info btn-sm d-flex align-items-center gap-1" onClick={()=>view(c.id)}><FiEye size={13}/> View</button>
                    <button className="btn btn-success btn-sm d-flex align-items-center gap-1" onClick={()=>act(c.id,"approved")}><FiCheck size={13}/> Approve</button>
                    <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={()=>act(c.id,"rejected")}><FiX size={13}/> Reject</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      <Modal show={!!detail} onClose={()=>setDetail(null)} title={`Claim #${detail?.id} Details`} size="modal-lg">
        {detail && <ClaimDetail detail={detail} onApprove={()=>act(detail.id,"approved")} onReject={()=>act(detail.id,"rejected")} />}
      </Modal>
    </div>
  );
}

function ClaimDetail({ detail, onApprove, onReject }) {
  return (
    <div>
      <div className="table-responsive">
        <table className="table table-sm table-bordered">
          <tbody>
            {[["Student",detail.claimer_name],["Amount",`PKR ${parseFloat(detail.amount).toLocaleString()}`],
              ["Department",detail.department],["Semester",detail.semester||"—"],
              ["HOD No",detail.hod_no||"—"],["EasyPaisa No",detail.easypaisa_no||"—"],
              ["Status",<Badge status={detail.status}/>],
              ["Submitted",new Date(detail.date_submitted).toLocaleString()]
            ].map(([k,v])=>(
              <tr key={k}><th className="table-light" style={{width:150,whiteSpace:"nowrap"}}>{k}</th><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-3">
        <strong>Description:</strong>
        <p className="bg-light rounded p-2 mt-1 small">{detail.description}</p>
      </div>
      {detail.hod_file_data && detail.hod_file_type?.startsWith("image/") ? (
        <div className="mb-3">
          <strong className="d-block mb-2">HOD Approval Document:</strong>
          <img src={`data:${detail.hod_file_type};base64,${detail.hod_file_data}`}
            alt={detail.hod_file_name} className="img-fluid rounded border" style={{maxHeight:320}}/>
          <small className="text-muted d-block mt-1">📎 {detail.hod_file_name}</small>
        </div>
      ) : detail.hod_file_name ? (
        <p className="text-muted small">📄 {detail.hod_file_name} (non-image)</p>
      ) : null}
      {detail.status === "pending" && (
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-success flex-fill d-flex align-items-center justify-content-center gap-1" onClick={onApprove}><FiCheck/> Approve</button>
          <button className="btn btn-danger flex-fill d-flex align-items-center justify-content-center gap-1" onClick={onReject}><FiX/> Reject</button>
        </div>
      )}
    </div>
  );
}

// ── 2. All Claims ─────────────────────────────────────────────────────────────
function AllClaimsSection({ token }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail]   = useState(null);
  const [msg, setMsg]         = useState(null);

  const load = () => { setLoading(true); getAllClaims(token).then(d=>setClaims(Array.isArray(d)?d:[])).catch(e=>setMsg({t:"danger",m:e.message})).finally(()=>setLoading(false)); };
  useEffect(load,[]);
  const del  = async id => { if(!confirm("Delete this claim?"))return; try{await deleteClaim(id,token);load();}catch(e){setMsg({t:"danger",m:e.message});} };
  const view = async id => { try{setDetail(await getClaimById(id,token));}catch(e){setMsg({t:"danger",m:e.message});} };

  return (
    <div>
      <PageHeader title="📋 All Claims" sub={`${claims.length} total claims`} />
      <Alrt type={msg?.t} msg={msg?.m} />
      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"/></div> : (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: "#1a6b4a", color: "#fff" }}>
                <tr>
                  <th className="py-3 px-3">#ID</th>
                  <th className="py-3 px-3">Claimer</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3 d-none d-md-table-cell">Dept</th>
                  <th className="py-3 px-3 d-none d-sm-table-cell">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.length===0
                  ? <tr><td colSpan={7} className="text-center py-5 text-muted">No claims yet</td></tr>
                  : claims.map(c=>(
                    <tr key={c.id}>
                      <td className="px-3 small fw-semibold">#{c.id}</td>
                      <td className="px-3 small">{c.claimer_name}</td>
                      <td className="px-3 small fw-semibold">PKR {parseFloat(c.amount).toLocaleString()}</td>
                      <td className="px-3 small d-none d-md-table-cell">{c.department}</td>
                      <td className="px-3 small d-none d-sm-table-cell">{new Date(c.date_submitted).toLocaleDateString()}</td>
                      <td className="px-3"><Badge status={c.status}/></td>
                      <td className="px-3">
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-info btn-sm" onClick={()=>view(c.id)}><FiEye size={13}/></button>
                          <button className="btn btn-outline-danger btn-sm" onClick={()=>del(c.id)}><FiTrash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal show={!!detail} onClose={()=>setDetail(null)} title={`Claim #${detail?.id}`} size="modal-lg">
        {detail && <ClaimDetail detail={detail} />}
      </Modal>
    </div>
  );
}

// ── 3. Manage Users ───────────────────────────────────────────────────────────
function ManageUsersSection({ token }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState(null);

  const load = () => { setLoading(true); getAllUsers(token).then(d=>setUsers(Array.isArray(d)?d:[])).catch(e=>setMsg({t:"danger",m:e.message})).finally(()=>setLoading(false)); };
  useEffect(load,[]);
  const del = async id => {
    if(!confirm("Delete this user and all their data?"))return;
    try{ await deleteUser(id,token); load(); setMsg({t:"success",m:"User deleted"}); }
    catch(e){ setMsg({t:"danger",m:e.message}); }
  };
  const donors=users.filter(u=>u.role==="donor").length;
  const claimers=users.filter(u=>u.role==="claimer").length;

  return (
    <div>
      <PageHeader title="👥 User Management" sub="View and manage all registered users" />
      <div className="row g-3 mb-4">
        {[["Total Users",users.length,"success"],["Students (Claimers)",claimers,"primary"],["Donors",donors,"warning"]].map(([l,v,c])=>(
          <div key={l} className="col-12 col-sm-4">
            <div className={`card border-0 shadow-sm text-center p-3 border-top border-${c} border-3`}>
              <div className={`fw-bold fs-2 text-${c}`}>{v}</div>
              <div className="text-muted small">{l}</div>
            </div>
          </div>
        ))}
      </div>
      <Alrt type={msg?.t} msg={msg?.m} />
      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"/></div> : (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: "#1a6b4a", color: "#fff" }}>
                <tr>
                  <th className="py-3 px-3">#ID</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3 d-none d-md-table-cell">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 d-none d-sm-table-cell">Registered</th>
                  <th className="py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length===0
                  ? <tr><td colSpan={6} className="text-center py-5 text-muted">No users registered yet</td></tr>
                  : users.map(u=>(
                    <tr key={u.id}>
                      <td className="px-3 small">#{u.id}</td>
                      <td className="px-3 small fw-semibold">{u.name}</td>
                      <td className="px-3 small d-none d-md-table-cell">{u.email}</td>
                      <td className="px-3"><span className={`badge bg-${u.role==="donor"?"warning text-dark":"primary"}`}>{u.role}</span></td>
                      <td className="px-3 small d-none d-sm-table-cell">{new Date(u.registration_date).toLocaleDateString()}</td>
                      <td className="px-3"><button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onClick={()=>del(u.id)}><FiTrash2 size={13}/> Delete</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 4. Send Messages ──────────────────────────────────────────────────────────
function SendMessageSection({ token }) {
  const [form, setForm]         = useState({ recipient:"all", subject:"", content:"" });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [msg, setMsg]           = useState(null);

  const load = () => { setLoading(true); getAllMessages(token).then(d=>setMessages(Array.isArray(d)?d:[])).catch(console.error).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const handleSend = async e => {
    e.preventDefault();
    if(!form.subject.trim()||!form.content.trim()){setMsg({t:"danger",m:"Subject and message required"});return;}
    setSending(true); setMsg(null);
    try{
      await sendMessage(form,token);
      setMsg({t:"success",m:`✅ Sent to ${form.recipient==="all"?"all users":form.recipient}!`});
      setForm({recipient:"all",subject:"",content:""});
      load();
    }catch(e){setMsg({t:"danger",m:e.message});}
    finally{setSending(false);}
  };
  const del = async id=>{ try{await deleteMessage(id,token);load();}catch(e){setMsg({t:"danger",m:e.message});} };
  const rcpColors={all:"success",claimers:"primary",donors:"warning"};
  const rcpLabels={all:"👥 All Users",claimers:"🎓 Students",donors:"💝 Donors"};

  return (
    <div>
      <PageHeader title="📨 Broadcast Message" sub="Messages visible to users registered before send date" />
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3" style={{color:"#1a6b4a"}}>Compose Message</h6>
              <Alrt type={msg?.t} msg={msg?.m} />
              <form onSubmit={handleSend}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Send To</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {[["all","👥 All"],["claimers","🎓 Students"],["donors","💝 Donors"]].map(([v,l])=>(
                      <button key={v} type="button"
                        className={`btn btn-sm ${form.recipient===v?`btn-${rcpColors[v]}`:`btn-outline-${rcpColors[v]}`}`}
                        onClick={()=>setForm({...form,recipient:v})}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Subject</label>
                  <input className="form-control" placeholder="Message subject..." value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} required/>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Message</label>
                  <textarea className="form-control" rows={5} placeholder="Write your message..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})} required/>
                </div>
                <button type="submit" className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2" disabled={sending}>
                  {sending?<><span className="spinner-border spinner-border-sm"/>Sending...</>:<><FiSend/>Send Message</>}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-7">
          <h6 className="fw-semibold mb-3">Sent Messages ({messages.length})</h6>
          {loading ? <div className="text-center py-4"><div className="spinner-border text-success"/></div>
          : messages.length===0 ? <div className="text-center py-5 text-muted"><FiMail size={40} className="mb-2 opacity-25 d-block mx-auto"/><p>No messages sent yet</p></div>
          : messages.map(m=>(
            <div key={m.id} className={`card border-0 shadow-sm mb-2 rounded-3 border-start border-${rcpColors[m.recipient]} border-3`}>
              <div className="card-body py-3 px-3">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span className="fw-semibold small">{m.subject}</span>
                      <span className={`badge bg-${rcpColors[m.recipient]}`}>{rcpLabels[m.recipient]}</span>
                      <small className="text-muted">{new Date(m.date_sent).toLocaleString()}</small>
                    </div>
                    <p className="small text-muted mb-0">{m.content}</p>
                  </div>
                  <button className="btn btn-outline-danger btn-sm flex-shrink-0" onClick={()=>del(m.id)}><FiTrash2 size={13}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 5. Donation Management ────────────────────────────────────────────────────
function DonationMgmtSection({ token }) {
  const [donations, setDonations] = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [viewD, setViewD]         = useState(null);
  const [msg, setMsg]             = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getAllDonations(token),getDonationStats(token)])
      .then(([d,s])=>{setDonations(Array.isArray(d)?d:[]);setStats(s||{});})
      .catch(e=>setMsg({t:"danger",m:e.message}))
      .finally(()=>setLoading(false));
  };
  useEffect(load,[]);
  const verify = async id => { try{await verifyDonation(id,token);setViewD(null);load();setMsg({t:"success",m:"✅ Donation verified!"});}catch(e){setMsg({t:"danger",m:e.message});} };
  const reject = async id => { try{await rejectDonation(id,token);setViewD(null);load();setMsg({t:"warning",m:"Donation rejected."});}catch(e){setMsg({t:"danger",m:e.message});} };
  const del    = async id => { if(!confirm("Delete?"))return; try{await deleteDonation(id,token);load();}catch(e){setMsg({t:"danger",m:e.message});} };

  return (
    <div>
      <PageHeader title="💰 Donation Management" sub="Verify payment screenshots from donors" />
      <div className="row g-3 mb-4">
        {[["Total Verified","PKR "+parseFloat(stats.totalFunds||0).toLocaleString(),"success"],
          ["Total Donations",stats.totalDonations||0,"primary"],
          ["Active Claims",stats.activeClaims||0,"warning"]].map(([l,v,c])=>(
          <div key={l} className="col-12 col-sm-4">
            <div className={`card border-0 shadow-sm border-start border-${c} border-3`}>
              <div className="card-body py-3"><p className="text-muted small mb-1">{l}</p><h4 className={`fw-bold text-${c} mb-0`}>{v}</h4></div>
            </div>
          </div>
        ))}
      </div>
      <Alrt type={msg?.t} msg={msg?.m} />
      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"/></div> : (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: "#1a6b4a", color: "#fff" }}>
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Donor</th>
                  <th className="py-3 px-3 d-none d-md-table-cell">Student</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3 d-none d-sm-table-cell">Method</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.length===0
                  ? <tr><td colSpan={7} className="text-center py-5 text-muted">No donations yet</td></tr>
                  : donations.map(d=>(
                    <tr key={d.id}>
                      <td className="px-3 small">#{d.id}</td>
                      <td className="px-3 small">{d.donor_name}<br/><small className="text-muted d-none d-md-inline">{d.donor_email}</small></td>
                      <td className="px-3 small d-none d-md-table-cell">{d.claimer_name||"—"}</td>
                      <td className="px-3 small fw-bold">PKR {parseFloat(d.amount).toLocaleString()}</td>
                      <td className="px-3 small d-none d-sm-table-cell">{d.payment_method}</td>
                      <td className="px-3"><Badge status={d.status}/></td>
                      <td className="px-3">
                        <div className="d-flex gap-1 flex-wrap">
                          <button className="btn btn-outline-info btn-sm" onClick={()=>setViewD(d)}><FiEye size={13}/></button>
                          {d.status==="pending"&&<>
                            <button className="btn btn-success btn-sm" onClick={()=>verify(d.id)}><FiCheck size={13}/></button>
                            <button className="btn btn-warning btn-sm" onClick={()=>reject(d.id)}><FiX size={13}/></button>
                          </>}
                          <button className="btn btn-outline-danger btn-sm" onClick={()=>del(d.id)}><FiTrash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal show={!!viewD} onClose={()=>setViewD(null)} title={`Donation #${viewD?.id} Screenshot`} size="modal-lg">
        {viewD && (
          <div>
            <div className="table-responsive mb-3">
              <table className="table table-sm table-bordered">
                <tbody>
                  {[["Donor",viewD.donor_name],["Student",viewD.claimer_name||"—"],
                    ["Amount",`PKR ${parseFloat(viewD.amount).toLocaleString()}`],
                    ["Method",viewD.payment_method],["Status",<Badge status={viewD.status}/>]
                  ].map(([k,v])=><tr key={k}><th style={{width:110}}>{k}</th><td>{v}</td></tr>)}
                </tbody>
              </table>
            </div>
            {viewD.screenshot_data
              ? <div className="text-center">
                  <img src={`data:${viewD.screenshot_type||"image/jpeg"};base64,${viewD.screenshot_data}`}
                    alt="Payment Screenshot" className="img-fluid rounded border shadow-sm" style={{maxHeight:400}}/>
                  <p className="text-muted small mt-2">📎 {viewD.screenshot_name}</p>
                </div>
              : <p className="text-center text-muted py-3">No screenshot uploaded</p>}
            {viewD.status==="pending" && (
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-success flex-fill d-flex align-items-center justify-content-center gap-1" onClick={()=>verify(viewD.id)}><FiCheck/> Verify</button>
                <button className="btn btn-danger flex-fill d-flex align-items-center justify-content-center gap-1" onClick={()=>reject(viewD.id)}><FiX/> Reject</button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── 6. System Stats ───────────────────────────────────────────────────────────
function SystemStatsSection({ token }) {
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState(null);
  useEffect(()=>{ getSystemStats(token).then(setStats).catch(e=>setMsg({t:"danger",m:e.message})).finally(()=>setLoading(false)); },[]);
  const cards=[
    {l:"Total Users",   v:stats.totalUsers,   c:"success", emoji:"👥"},
    {l:"Total Claims",  v:stats.totalClaims,  c:"primary", emoji:"📋"},
    {l:"Approval Rate", v:stats.approvalRate, c:"warning", emoji:"✅"},
    {l:"Active Donors", v:stats.activeDonors, c:"danger",  emoji:"💝"},
  ];
  return (
    <div>
      <PageHeader title="📊 System Statistics" sub="Platform activity overview" />
      <Alrt type={msg?.t} msg={msg?.m} />
      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"/></div> : (
        <div className="row g-3 g-md-4">
          {cards.map(({l,v,c,emoji})=>(
            <div key={l} className="col-6 col-lg-3">
              <div className={`card border-0 shadow-sm text-center p-4 rounded-3 border-top border-${c} border-3`}>
                <div style={{fontSize:"2.2rem"}}>{emoji}</div>
                <p className="text-muted small mt-2 mb-1">{l}</p>
                <h2 className={`fw-bold text-${c} mb-0`}>{v||0}</h2>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 7. Department Contact ─────────────────────────────────────────────────────
function DeptContactSection({ token }) {
  const [depts, setDepts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({name:"",hod_no:"",clerk_no:""});
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);
  const load=()=>{ setLoading(true); getDepartments(token).then(d=>setDepts(Array.isArray(d)?d:[])).catch(e=>setMsg({t:"danger",m:e.message})).finally(()=>setLoading(false)); };
  useEffect(load,[]);
  const openAdd  = ()=>{ setForm({name:"",hod_no:"",clerk_no:""}); setModal("add"); };
  const openEdit = d=>{ setForm({name:d.name,hod_no:d.hod_no,clerk_no:d.clerk_no}); setModal(d); };
  const save = async e => {
    e.preventDefault(); setSaving(true);
    try{
      if(modal==="add") await addDepartment(form,token);
      else await updateDepartment(modal.id,form,token);
      setModal(null); load(); setMsg({t:"success",m:"Saved!"});
    }catch(e){setMsg({t:"danger",m:e.message});}
    finally{setSaving(false);}
  };
  const del=async id=>{ if(!confirm("Delete?"))return; try{await deleteDepartment(id,token);load();}catch(e){setMsg({t:"danger",m:e.message});} };
  return (
    <div>
      <PageHeader title="🏛 Department Contact" sub="Manage department HOD and clerk contacts">
        <button className="btn btn-success d-flex align-items-center gap-1" onClick={openAdd}><FiPlus size={15}/>Add Department</button>
      </PageHeader>
      <Alrt type={msg?.t} msg={msg?.m} />
      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"/></div> : (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: "#1a6b4a", color: "#fff" }}>
                <tr><th className="py-3 px-3">#</th><th className="py-3 px-3">Department</th><th className="py-3 px-3 d-none d-sm-table-cell">HOD No</th><th className="py-3 px-3 d-none d-md-table-cell">Clerk No</th><th className="py-3 px-3">Actions</th></tr>
              </thead>
              <tbody>
                {depts.length===0
                  ? <tr><td colSpan={5} className="text-center py-5 text-muted">No departments yet</td></tr>
                  : depts.map(d=>(
                    <tr key={d.id}>
                      <td className="px-3 small">#{d.id}</td>
                      <td className="px-3 small fw-semibold">{d.name}</td>
                      <td className="px-3 small d-none d-sm-table-cell">{d.hod_no}</td>
                      <td className="px-3 small d-none d-md-table-cell">{d.clerk_no}</td>
                      <td className="px-3">
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-warning btn-sm" onClick={()=>openEdit(d)}><FiEdit size={13}/></button>
                          <button className="btn btn-outline-danger btn-sm" onClick={()=>del(d.id)}><FiTrash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal show={!!modal} onClose={()=>setModal(null)} title={modal==="add"?"Add Department":"Edit Department"}>
        <form onSubmit={save}>
          <div className="mb-3"><label className="form-label fw-semibold small">Department Name</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
          <div className="mb-3"><label className="form-label fw-semibold small">HOD Contact No</label><input className="form-control" value={form.hod_no} onChange={e=>setForm({...form,hod_no:e.target.value})} required/></div>
          <div className="mb-3"><label className="form-label fw-semibold small">Clerk Contact No</label><input className="form-control" value={form.clerk_no} onChange={e=>setForm({...form,clerk_no:e.target.value})} required/></div>
          <div className="d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={saving}>{saving?"Saving...":"Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── 8. Payment Info ───────────────────────────────────────────────────────────
function PaymentInfoSection({ token }) {
  const [form, setForm]       = useState({easypaisa_no:"",jazzcash_no:"",bank_name:"",bank_account:"",bank_title:""});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);
  useEffect(()=>{
    getPaymentInfo().then(d=>{ if(d&&d.id) setForm({easypaisa_no:d.easypaisa_no||"",jazzcash_no:d.jazzcash_no||"",bank_name:d.bank_name||"",bank_account:d.bank_account||"",bank_title:d.bank_title||""}); })
    .catch(console.error).finally(()=>setLoading(false));
  },[]);
  const save = async e => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try{ await savePaymentInfo(form,token); setMsg({t:"success",m:"✅ Payment info saved!"}); }
    catch(e){ setMsg({t:"danger",m:e.message}); }
    finally{ setSaving(false); }
  };
  return (
    <div>
      <PageHeader title="💳 Payment Settings" sub="Set the payment numbers shown to all donors" />
      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"/></div> : (
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <Alrt type={msg?.t} msg={msg?.m} />
                <form onSubmit={save}>
                  <h6 className="fw-bold mb-3" style={{color:"#1a6b4a"}}>📱 Mobile Payments</h6>
                  <div className="mb-3"><label className="form-label fw-semibold small">EasyPaisa Number</label><input className="form-control" placeholder="03xx-xxxxxxx" value={form.easypaisa_no} onChange={e=>setForm({...form,easypaisa_no:e.target.value})}/></div>
                  <div className="mb-4"><label className="form-label fw-semibold small">JazzCash Number</label><input className="form-control" placeholder="03xx-xxxxxxx" value={form.jazzcash_no} onChange={e=>setForm({...form,jazzcash_no:e.target.value})}/></div>
                  <h6 className="fw-bold mb-3" style={{color:"#1a6b4a"}}>🏦 Bank Transfer</h6>
                  <div className="mb-3"><label className="form-label fw-semibold small">Bank Name</label><input className="form-control" placeholder="e.g. HBL, Meezan, UBL" value={form.bank_name} onChange={e=>setForm({...form,bank_name:e.target.value})}/></div>
                  <div className="mb-3"><label className="form-label fw-semibold small">Account Number / IBAN</label><input className="form-control" placeholder="e.g. PK36HABB0000..." value={form.bank_account} onChange={e=>setForm({...form,bank_account:e.target.value})}/></div>
                  <div className="mb-4"><label className="form-label fw-semibold small">Account Title</label><input className="form-control" placeholder="e.g. Fundraising System" value={form.bank_title} onChange={e=>setForm({...form,bank_title:e.target.value})}/></div>
                  <button type="submit" className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2" disabled={saving}>
                    {saving?<><span className="spinner-border spinner-border-sm"/>Saving...</>:"💾 Save Payment Info"}
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 text-white" style={{background:"linear-gradient(135deg,#1a6b4a,#2d9e6e)"}}>
              <div className="card-body p-4">
                <h6 className="fw-bold mb-2 opacity-75">👀 Donor Preview</h6>
                <p className="small opacity-75 mb-3">This banner appears on every donor dashboard page:</p>
                <div className="rounded-3 p-3" style={{background:"rgba(255,255,255,0.12)"}}>
                  <p className="small fw-bold mb-2 opacity-75">💳 ADMIN PAYMENT NUMBERS</p>
                  {form.easypaisa_no && <p className="mb-1 small">📱 EasyPaisa: <strong>{form.easypaisa_no}</strong></p>}
                  {form.jazzcash_no  && <p className="mb-1 small">📱 JazzCash: <strong>{form.jazzcash_no}</strong></p>}
                  {form.bank_account && <p className="mb-0 small">🏦 {form.bank_name||"Bank"}: <strong>{form.bank_account}</strong>{form.bank_title&&` (${form.bank_title})`}</p>}
                  {!form.easypaisa_no&&!form.jazzcash_no&&!form.bank_account && <p className="opacity-50 mb-0 small">Fill the form to preview...</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

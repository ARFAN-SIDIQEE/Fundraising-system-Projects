// frontend/src/pages/donor/DonorDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApprovedClaims, getMyDonations, getDonorMessages, submitDonation, getPaymentInfo } from "../../services/api";
import {
  FiList, FiDollarSign, FiMail, FiLogOut, FiMenu, FiX,
  FiHeart, FiArrowLeft, FiUpload, FiUser, FiAlertCircle,
  FiCheckCircle, FiClock, FiXCircle, FiImage,
} from "react-icons/fi";

// ── Payment Banner ─────────────────────────────────────────────────────────────
function PaymentBanner({ info }) {
  if (!info || (!info.easypaisa_no && !info.jazzcash_no && !info.bank_account)) return null;
  return (
    <div className="rounded-3 text-white mb-4 p-3"
      style={{ background:"linear-gradient(135deg,#1a6b4a,#2d9e6e)", boxShadow:"0 4px 15px rgba(26,107,74,0.3)" }}>
      <div className="fw-semibold small mb-2" style={{ opacity:0.85, letterSpacing:0.5 }}>
        💳 ADMIN PAYMENT NUMBERS — Send your donation to any:
      </div>
      <div className="d-flex flex-wrap gap-2">
        {info.easypaisa_no && (
          <div className="rounded-3 px-3 py-2" style={{ background:"rgba(255,255,255,0.18)", minWidth:140 }}>
            <div className="small mb-1" style={{ opacity:0.8 }}>📱 EasyPaisa</div>
            <div className="fw-bold" style={{ fontSize:"1.1rem", letterSpacing:0.5 }}>{info.easypaisa_no}</div>
          </div>
        )}
        {info.jazzcash_no && (
          <div className="rounded-3 px-3 py-2" style={{ background:"rgba(255,255,255,0.18)", minWidth:140 }}>
            <div className="small mb-1" style={{ opacity:0.8 }}>📱 JazzCash</div>
            <div className="fw-bold" style={{ fontSize:"1.1rem", letterSpacing:0.5 }}>{info.jazzcash_no}</div>
          </div>
        )}
        {info.bank_account && (
          <div className="rounded-3 px-3 py-2" style={{ background:"rgba(255,255,255,0.18)", minWidth:180 }}>
            <div className="small mb-1" style={{ opacity:0.8 }}>🏦 {info.bank_name||"Bank Transfer"}</div>
            <div className="fw-bold">{info.bank_account}</div>
            {info.bank_title && <div className="small" style={{ opacity:0.85 }}>{info.bank_title}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

const NAV = [
  { key:"approved-claims", label:"Approved Claims", Icon: FiList },
  { key:"my-donations",    label:"My Donations",    Icon: FiDollarSign },
  { key:"messages",        label:"Messages",        Icon: FiMail },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SidebarContent({ active, setActive, user, onLogout, onClose }) {
  const PURPLE = "linear-gradient(180deg,#7b1fa2 0%,#4a0072 100%)";
  return (
    <div className="d-flex flex-column h-100" style={{ background:PURPLE, minHeight:"100vh" }}>
      <div className="d-flex align-items-center justify-content-between px-3 py-4"
        style={{ borderBottom:"1px solid rgba(255,255,255,0.12)" }}>
        <div className="d-flex align-items-center gap-2 text-white fw-bold">
          <FiHeart size={20}/>
          <div>
            <div style={{fontSize:"0.95rem"}}>Fundraising</div>
            <div style={{fontSize:"0.68rem",opacity:0.6,fontWeight:400}}>Donor Dashboard</div>
          </div>
        </div>
        {onClose && (
          <button className="btn btn-sm p-0 text-white" style={{background:"transparent",border:"none"}}
            onClick={onClose}><FiX size={20}/></button>
        )}
      </div>

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
export default function DonorDashboard() {
  const { user, token, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [active, setActive]           = useState("approved-claims");
  const [donationClaim, setDonationClaim] = useState(null);
  const [payInfo, setPayInfo]         = useState(null);
  const [sideOpen, setSideOpen]       = useState(false);

  useEffect(()=>{ getPaymentInfo().then(setPayInfo).catch(console.error); },[]);

  const handleLogout = () => { logoutUser(); navigate("/"); };
  const handleDonate = claim => { setDonationClaim(claim); setActive("donate"); };
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

      <div className="flex-grow-1" style={{minWidth:0}}>

        {/* Mobile top bar */}
        <div className="d-lg-none d-flex align-items-center gap-3 px-3 py-2 text-white sticky-top"
          style={{background:"#7b1fa2",zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
          <button className="btn btn-sm p-1 text-white" style={{background:"transparent",border:"none"}}
            onClick={()=>setSideOpen(true)}><FiMenu size={22}/></button>
          <div className="d-flex align-items-center gap-2">
            {currentSection && <currentSection.Icon size={16}/>}
            <span className="fw-semibold" style={{fontSize:"0.9rem"}}>
              {active==="donate"?"Donate Now":currentSection?.label}
            </span>
          </div>
        </div>

        <div className="p-3 p-md-4">
          <PaymentBanner info={payInfo}/>
          {active==="approved-claims" && <ApprovedClaimsSection token={token} onDonate={handleDonate}/>}
          {active==="my-donations"    && <MyDonationsSection    user={user} token={token}/>}
          {active==="messages"        && <DonorMessagesSection  token={token}/>}
          {active==="donate"          && (
            <DonateSection claim={donationClaim} user={user} token={token} payInfo={payInfo}
              onBack={()=>setActive("approved-claims")}
              onSuccess={()=>setActive("my-donations")}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Approved Claims ────────────────────────────────────────────────────────────
function ApprovedClaimsSection({ token, onDonate }) {
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    getApprovedClaims()
      .then(data=>setClaims(Array.isArray(data)?data:[]))
      .catch(console.error)
      .finally(()=>setLoading(false));
  },[]);

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold d-flex align-items-center gap-2" style={{color:"#7b1fa2"}}>
          <FiList/>Approved Claims
        </h4>
        <p className="text-muted small mb-0">Students approved for donations — select one to help</p>
      </div>

      {loading
        ? <div className="text-center py-5"><div className="spinner-border" style={{color:"#7b1fa2"}}/></div>
        : claims.length===0
          ? (
            <div className="text-center py-5 text-muted">
              <FiList size={48} className="mb-3 d-block mx-auto opacity-25"/>
              <h5>No approved claims yet</h5>
            </div>
          )
          : claims.map(c=>(
            <div key={c.id} className="card border-0 shadow-sm mb-3 rounded-3" style={{borderLeft:"4px solid #1a6b4a"}}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="flex-grow-1">
                    <h5 className="fw-bold mb-2" style={{color:"#1a6b4a"}}>{c.claimer_name}</h5>
                    <p className="mb-1 small">
                      <strong>Amount Needed:</strong> PKR {parseFloat(c.amount).toLocaleString()} &nbsp;·&nbsp;
                      <strong>Dept:</strong> {c.department}
                      {c.semester && <> &nbsp;·&nbsp; <strong>Sem:</strong> {c.semester}</>}
                    </p>
                    <p className="text-muted small mb-0" style={{lineHeight:1.6}}>
                      <strong>DEscription:</strong>
                      {c.description?.substring(0,160)}...
                    </p>
                  </div>
                  <button className="btn btn-sm fw-semibold px-3 d-flex align-items-center gap-1 flex-shrink-0"
                    style={{background:"#1a6b4a",color:"white"}} onClick={()=>onDonate(c)}>
                    <FiHeart size={14}/> Donate Now
                  </button>
                </div>
              </div>
            </div>
          ))
      }
    </div>
  );
}

// ── Donate Section ─────────────────────────────────────────────────────────────
function DonateSection({ claim, user, token, payInfo, onBack, onSuccess }) {
  const [form, setForm]       = useState({ amount:claim?.amount||"", payment_method:"EasyPaisa", payment_date:new Date().toISOString().split("T")[0] });
  const [screenshot, setScreenshot] = useState(null);
  const [alert, setAlert]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = e => {
    const file = e.target.files[0]; if(!file) return;
    if(file.size > 10*1024*1024){ setAlert({type:"danger",msg:"File too large. Max 10MB."}); return; }
    const reader = new FileReader();
    reader.onload = ev => { setScreenshot({data:ev.target.result.split(",")[1],type:file.type,name:file.name}); setAlert(null); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if(!screenshot){ setAlert({type:"danger",msg:"⚠️ Please upload your payment screenshot"}); return; }
    if(!form.amount||parseFloat(form.amount)<100){ setAlert({type:"danger",msg:"Minimum donation is PKR 100"}); return; }
    setLoading(true); setAlert(null);
    try{
      await submitDonation({
        claim_id:claim.id, donor_id:user.id, donor_name:user.name,
        amount:parseFloat(form.amount), payment_method:form.payment_method,
        screenshot_data:screenshot.data, screenshot_type:screenshot.type, screenshot_name:screenshot.name,
        payment_date:form.payment_date,
      }, token);
      setAlert({type:"success",msg:"✅ Donation submitted! Admin will verify your screenshot soon."});
      setTimeout(onSuccess, 2000);
    }catch(err){
      setAlert({type:"danger",msg:err.message});
      setLoading(false);
    }
  };

  if(!claim) return null;
  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={onBack}>
          <FiArrowLeft size={14}/> Back
        </button>
        <div>
          <h4 className="fw-bold mb-0" style={{color:"#7b1fa2"}}>Donate to {claim.claimer_name}</h4>
          <p className="text-muted small mb-0">Send payment first, then upload screenshot</p>
        </div>
      </div>

      {/* Step 1 */}
      <div className="card border-0 shadow-sm rounded-3 mb-3" style={{borderLeft:"4px solid #1a6b4a"}}>
        <div className="card-body p-3 p-md-4">
          <h6 className="fw-bold mb-2" style={{color:"#1a6b4a"}}>Step 1 — Send Payment</h6>
          <p className="small text-secondary mb-3">
            Send <strong>PKR {parseFloat(claim.amount).toLocaleString()}</strong> to any admin payment number shown in the green banner above.
          </p>
          <div className="rounded-3 p-3" style={{background:"#f0fdf4"}}>
            {payInfo?.easypaisa_no && <p className="mb-1 small">📱 <strong>EasyPaisa:</strong> <span className="fw-bold" style={{color:"#1a6b4a"}}>{payInfo.easypaisa_no}</span></p>}
            {payInfo?.jazzcash_no  && <p className="mb-1 small">📱 <strong>JazzCash:</strong>  <span className="fw-bold" style={{color:"#1a6b4a"}}>{payInfo.jazzcash_no}</span></p>}
            {payInfo?.bank_account && <p className="mb-0 small">🏦 <strong>{payInfo.bank_name}:</strong> <span className="fw-bold" style={{color:"#1a6b4a"}}>{payInfo.bank_account}</span> ({payInfo.bank_title})</p>}
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="card border-0 shadow-sm rounded-3" style={{maxWidth:540}}>
        <div className="card-body p-3 p-md-4">
          <h6 className="fw-bold mb-3" style={{color:"#7b1fa2"}}>Step 2 — Submit Screenshot</h6>
          {alert && <div className={`alert alert-${alert.type} d-flex align-items-center gap-2 py-2 small`}><FiAlertCircle size={15}/>{alert.msg}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Amount (PKR)</label>
              <input className="form-control" type="number" min="100" value={form.amount}
                onChange={e=>setForm({...form,amount:e.target.value})} required/>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Payment Method</label>
              <select className="form-select" value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}>
                <option value="EasyPaisa">📱 EasyPaisa</option>
                <option value="JazzCash">📱 JazzCash</option>
                <option value="Bank Transfer">🏦 Bank Transfer</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Payment Date</label>
              <input className="form-control" type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})}/>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold small">
                📸 Payment Screenshot <span className="text-danger">*Required</span>
              </label>
              <div className="rounded-3 p-4 text-center" style={{
                border:`2px dashed ${screenshot?"#1a6b4a":"#d1d5db"}`,
                background: screenshot?"#f0fdf4":"#f9fafb", transition:"all 0.2s"
              }}>
                {screenshot ? (
                  <div>
                    <img src={`data:${screenshot.type};base64,${screenshot.data}`} alt="screenshot"
                      className="img-fluid rounded-2 mb-2 shadow-sm" style={{maxHeight:200}}/>
                    <p className="small fw-semibold mb-2" style={{color:"#059669"}}>
                      <FiCheckCircle className="me-1"/>✅ {screenshot.name}
                    </p>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>setScreenshot(null)}>
                      🔄 Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <FiUpload size={32} className="mb-2 text-muted"/>
                    <p className="small text-muted mb-2">Upload your payment screenshot for admin verification</p>
                    <label className="btn btn-sm fw-semibold px-3" style={{background:"#1a6b4a",color:"white",cursor:"pointer"}}>
                      <FiImage size={14} className="me-1"/>Choose Screenshot
                      <input type="file" accept="image/*,.pdf" onChange={handleFile} style={{display:"none"}}/>
                    </label>
                    <p className="text-muted mt-2" style={{fontSize:"0.72rem"}}>All image formats — Max 10MB</p>
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="btn w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
              style={{background:"#7b1fa2",color:"white"}} disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm"/>Submitting...</>
                : <><FiHeart/>Submit Donation for Verification</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── My Donations ───────────────────────────────────────────────────────────────
function MyDonationsSection({ user, token }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [preview, setPreview]     = useState(null);

  useEffect(()=>{
    getMyDonations(user.id,token)
      .then(data=>setDonations(Array.isArray(data)?data:[]))
      .catch(console.error)
      .finally(()=>setLoading(false));
  },[]);

  const statusColor = { verified:"success", rejected:"danger", pending:"warning" };
  const statusLabel = { verified:"✅ Verified", rejected:"❌ Rejected", pending:"⏳ Pending" };
  const borderColor = { verified:"#1a6b4a", rejected:"#ef4444", pending:"#f59e0b" };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold d-flex align-items-center gap-2" style={{color:"#7b1fa2"}}>
          <FiDollarSign/>My Donations
        </h4>
        <p className="text-muted small mb-0">Track your donation history and verification status</p>
      </div>

      {loading
        ? <div className="text-center py-5"><div className="spinner-border" style={{color:"#7b1fa2"}}/></div>
        : donations.length===0
          ? (
            <div className="text-center py-5 text-muted">
              <FiDollarSign size={48} className="mb-3 d-block mx-auto opacity-25"/>
              <h5>No donations yet</h5>
              <p className="small">Go to Approved Claims and donate to a student</p>
            </div>
          )
          : donations.map(d=>(
            <div key={d.id} className="card border-0 shadow-sm mb-3 rounded-3"
              style={{borderLeft:`4px solid ${borderColor[d.status]||"#6b7280"}`}}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <p className="mb-1 small"><strong>To:</strong> {d.claimer_name||"—"} &nbsp;·&nbsp; <strong>Amount:</strong> <span className="fw-bold">PKR {parseFloat(d.amount).toLocaleString()}</span></p>
                    <p className="mb-2 small"><strong>Method:</strong> {d.payment_method} &nbsp;·&nbsp; <strong>Date:</strong> {d.payment_date?new Date(d.payment_date).toLocaleDateString():"—"}</p>
                    <span className={`badge bg-${statusColor[d.status]||"secondary"} ${d.status==="pending"?"text-dark":""}`}>
                      {statusLabel[d.status]||d.status}
                    </span>
                  </div>
                  {d.screenshot_name && (
                    <button className="btn btn-sm btn-outline-info d-flex align-items-center gap-1 flex-shrink-0"
                      onClick={()=>setPreview(d)}>
                      <FiImage size={13}/>Screenshot
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
      }

      {/* Screenshot Modal */}
      {preview && (
        <div className="modal d-block" style={{background:"rgba(0,0,0,0.6)",zIndex:1055}} onClick={()=>setPreview(null)}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={e=>e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Payment Screenshot</h5>
                <button className="btn-close" onClick={()=>setPreview(null)}/>
              </div>
              <div className="modal-body">
                <p className="small mb-3"><strong>To:</strong> {preview.claimer_name} &nbsp;|&nbsp; <strong>Amount:</strong> PKR {parseFloat(preview.amount).toLocaleString()}</p>
                <img src={`data:${preview.screenshot_type||"image/jpeg"};base64,${preview.screenshot_data}`}
                  alt="screenshot" className="img-fluid rounded-3 shadow-sm"/>
                <p className="text-muted small mt-2 mb-0">📎 {preview.screenshot_name}</p>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary w-100" onClick={()=>setPreview(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Donor Messages ─────────────────────────────────────────────────────────────
function DonorMessagesSection({ token }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(()=>{
    getDonorMessages(token)
      .then(data=>setMessages(Array.isArray(data)?data:[]))
      .catch(console.error)
      .finally(()=>setLoading(false));
  },[]);

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold d-flex align-items-center gap-2" style={{color:"#7b1fa2"}}>
          <FiMail/>Messages
        </h4>
        <p className="text-muted small mb-0">Broadcast messages from the admin team</p>
      </div>

      {loading
        ? <div className="text-center py-5"><div className="spinner-border" style={{color:"#7b1fa2"}}/></div>
        : messages.length===0
          ? (
            <div className="text-center py-5 text-muted">
              <FiMail size={48} className="mb-3 d-block mx-auto opacity-25"/>
              <h5>No messages yet</h5>
              <p className="small">Admin messages sent after your registration will appear here</p>
            </div>
          )
          : messages.map(m=>(
            <div key={m.id} className="card border-0 shadow-sm mb-3 rounded-3 border-start border-3"
              style={{borderLeftColor:"#4361ee"}}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                  <h6 className="fw-bold mb-0">{m.subject}</h6>
                  <small className="text-muted d-flex align-items-center gap-1">
                    <FiClock size={11}/>{new Date(m.date_sent).toLocaleString()}
                  </small>
                </div>
                <p className="text-secondary small mb-0" style={{lineHeight:1.7}}>{m.content}</p>
              </div>
            </div>
          ))
      }
    </div>
  );
}

// frontend/src/components/Navbar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiHome, FiFileText, FiLogIn, FiUserPlus, FiLogOut, FiGrid, FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => { logoutUser(); navigate("/"); setOpen(false); };

  return (
    <nav className="navbar navbar-expand-lg sticky-top shadow-sm" style={{ background:"linear-gradient(135deg,#1a6b4a,#0f4a32)" }}>
      <div className="container">
        <Link className="navbar-brand fw-bold text-white fs-5" to="/">
          🎓 Fundraising System
        </Link>
        <button className="navbar-toggler border-0" onClick={() => setOpen(!open)}
          style={{ color:"white", background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px" }}>
          {open ? <FiX size={20} color="white"/> : <FiMenu size={20} color="white"/>}
        </button>
        <div className={`collapse navbar-collapse ${open?"show":""}`}>
          <ul className="navbar-nav ms-auto align-items-lg-center gap-1">
            <li className="nav-item">
              <Link className="nav-link text-white d-flex align-items-center gap-1" to="/" onClick={()=>setOpen(false)}>
                <FiHome size={15}/>Home
              </Link>
            </li>
           
            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-white d-flex align-items-center gap-1"
                    to={user.role==="claimer"?"/claimer":"/donor"} onClick={()=>setOpen(false)}>
                    <FiGrid size={15}/>Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-sm btn-danger d-flex align-items-center gap-1 ms-lg-2" onClick={logout}>
                    <FiLogOut size={14}/>Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-white d-flex align-items-center gap-1" to="/login" onClick={()=>setOpen(false)}>
                    <FiLogIn size={15}/>Login
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <Link className="btn btn-sm fw-semibold d-flex align-items-center gap-1"
                    style={{ background:"white", color:"#1a6b4a" }} to="/register" onClick={()=>setOpen(false)}>
                    <FiUserPlus size={14}/>Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

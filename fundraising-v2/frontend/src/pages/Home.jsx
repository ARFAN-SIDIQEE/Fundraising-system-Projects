// frontend/src/pages/Home.jsx
import { Link } from "react-router-dom";
import { FiArrowRight, FiGift, FiShield, FiUsers } from "react-icons/fi";

export default function Home() {
  const steps = [
    { icon:"🎓", title:"For Students",  desc:"Register as a claimer, submit your financial assistance request with HOD approval, and get funded by generous donors." },
    { icon:"💝", title:"For Donors",    desc:"Browse approved student claims and support those who need financial help to complete their education." },
    { icon:"⚙️", title:"For Admins",   desc:"Manage claims, verify donations, send broadcast messages, and ensure full transparency in the process." },
  ];
  const quotes = [
    { q:"Education is the most powerful weapon which you can use to change the world.", a:"Nelson Mandela" },
    { q:"An investment in knowledge pays the best interest.", a:"Benjamin Franklin" },
    { q:"The function of education is to teach one to think intensively and to think critically.", a:"Martin Luther King Jr." },
  ];
  const stories = [
    { icon:"🌟", title:"Sarah's Journey", desc:"Thanks to this platform, I completed my engineering degree and now work at a leading tech company." },
    { icon:"🎯", title:"Medical Student", desc:"The support I received helped me focus on my studies without financial worries." },
    { icon:"📚", title:"Ali's Success",   desc:"I was able to complete my final semester and graduate with honors thanks to kind donors." },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-5" style={{ background:"linear-gradient(135deg,#1a6b4a,#0f4a32)", minHeight:"85vh", display:"flex", alignItems:"center" }}>
        <div className="container text-center text-white">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3" style={{ lineHeight:1.2 }}>Support Students<br/>in Need 🎓</h1>
              <p className="lead mb-4 opacity-75">Join our platform to help students achieve their educational goals through transparent fundraising.</p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Link to="/register" className="btn btn-lg fw-bold px-4" style={{ background:"white", color:"#1a6b4a" }}>
                  Get Started <FiArrowRight className="ms-1"/>
                </Link>
                <Link to="/login" className="btn btn-lg btn-outline-light px-4">
                  Login
                </Link>
              </div>
              <div className="row g-3 mt-5">
                {[["1000+","Students Helped"],["PKR 5M+","Funds Raised"],["500+","Active Donors"]].map(([v,l])=>(
                  <div key={l} className="col-4">
                    <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:12, padding:"16px 8px" }}>
                      <div className="fw-bold fs-4">{v}</div>
                      <div className="small opacity-75">{l}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-2" style={{ color:"#1a6b4a" }}>How It Works</h2>
          <p className="text-center text-muted mb-5">Simple steps to make a difference</p>
          <div className="row g-4">
            {steps.map(s=>(
              <div key={s.title} className="col-md-4">
                <div className="card h-100 border-0 shadow-sm text-center p-4">
                  <div style={{ fontSize:"3rem", marginBottom:16 }}>{s.icon}</div>
                  <h5 className="fw-bold mb-3" style={{ color:"#1a6b4a" }}>{s.title}</h5>
                  <p className="text-muted small mb-0" style={{ lineHeight:1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <h2 className="fw-bold mb-3" style={{ color:"#1a6b4a" }}>Why Choose Us?</h2>
              <p className="text-muted mb-4">We provide a secure and transparent fundraising platform specifically designed for students.</p>
              {[
                [<FiShield/>, "Verified Claims",     "All claims are reviewed and approved by admin before being visible to donors."],
                [<FiUsers/>, "Community Support",    "Join thousands of donors and students working together for education."],
                [<FiGift/>,  "Easy Donations",       "Simple payment process with screenshot verification for full transparency."],
              ].map(([Icon, title, desc])=>(
                <div key={title} className="d-flex gap-3 mb-3">
                  <div style={{ width:44, height:44, background:"#d1fae5", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#1a6b4a", fontSize:"1.2rem" }}>{Icon}</div>
                  <div><h6 className="fw-bold mb-1">{title}</h6><p className="text-muted small mb-0">{desc}</p></div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </section>

      {/* Quotes */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-5" style={{ color:"#1a6b4a" }}>Inspirational Quotes</h2>
          <div className="row g-4">
            {quotes.map(q=>(
              <div key={q.a} className="col-md-4">
                <div className="card h-100 border-0 shadow-sm p-4" style={{ borderLeft:"4px solid #1a6b4a" }}>
                  <p className="fst-italic text-muted mb-3" style={{ lineHeight:1.7 }}>"{q.q}"</p>
                  <p className="fw-semibold mb-0" style={{ color:"#1a6b4a" }}>— {q.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-5 bg-white">
        <div className="container">
          <h2 className="text-center fw-bold mb-5" style={{ color:"#1a6b4a" }}>Success Stories</h2>
          <div className="row g-4">
            {stories.map(s=>(
              <div key={s.title} className="col-md-4">
                <div className="card h-100 border-0 shadow-sm text-center p-4">
                  <div style={{ fontSize:"3rem", marginBottom:12 }}>{s.icon}</div>
                  <h5 className="fw-bold mb-2">{s.title}</h5>
                  <p className="text-muted small mb-0">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5" style={{ background:"linear-gradient(135deg,#1a6b4a,#0f4a32)" }}>
        <div className="container text-center text-white">
          <h2 className="fw-bold mb-3">Ready to Make a Difference?</h2>
          <p className="opacity-75 mb-4">Join our community of students and donors today</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/register" className="btn btn-lg fw-bold px-5" style={{ background:"white", color:"#1a6b4a" }}>Join Now</Link>
            <Link to="/terms" className="btn btn-lg btn-outline-light px-5">Terms & Policies</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center text-white" style={{ background:"#0f4a32" }}>
        <div className="container">
          <p className="mb-1">© 2025 Fundraising System — Empowering Students Through Compassion</p>
          <Link to="/terms" className="text-white-50 small">Terms & Policies</Link>
          <span className="text-white-50 mx-2">|</span>
         
        </div>
      </footer>
    </>
  );
}

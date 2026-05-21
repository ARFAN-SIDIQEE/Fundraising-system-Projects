// frontend/src/pages/Terms.jsx
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const sections = [
  { title: "1. Introduction", content: "Welcome to Fundraising System. By using our website and services, you agree to comply with the following Terms and Policies. If you do not agree, please refrain from using our platform." },
  { title: "2. Definitions", items: ['"We," "Us," "Our" refer to the Fundraising System and its management.', '"User" refers to anyone who uses our website or services.', '"Campaign" refers to a fundraising activity created by a user.', '"Donation" refers to any financial contribution made through our system.'] },
  { title: "3. Eligibility", items: ["Users must be at least 18 years old or have parental consent.", "All information provided must be accurate and complete.", "Use of the platform for illegal or fraudulent activity is prohibited."] },
  { title: "4. User Responsibilities", content: "Users agree to:", items: ["Provide truthful information and maintain updated details.", "Use funds solely for their declared purpose.", "Respect others and refrain from sharing misleading or harmful content."] },
  { title: "5. Donations and Payments", items: ["All donations are voluntary and generally non-refundable.", "Payment processing is handled through secure third-party services.", "We do not store users' banking or credit card information."] },
  { title: "6. Campaign Guidelines", items: ["Campaigns must clearly describe goals and usage of funds.", "Funds must be used exclusively for their intended purpose.", "Illegal, political, or violent campaigns are not allowed."] },
  { title: "7. Intellectual Property", content: "All website content belongs to Fundraising System unless stated otherwise. Users retain rights to their content but grant us a non-exclusive license to display it on the platform." },
  { title: "8. Privacy Policy", content: "We respect your privacy and collect only necessary data, such as basic user information, transaction details, and website usage analytics. We do not sell personal data and ensure compliance with data protection laws." },
  { title: "9. Security", content: "We use advanced encryption and secure servers. However, users are responsible for safeguarding their login credentials." },
  { title: "10. Prohibited Activities", items: ["Creating fake campaigns or impersonating others.", "Uploading malicious or illegal content.", "Violating laws or third-party rights."] },
  { title: "11. Limitation of Liability", content: "Fundraising System is not responsible for misuse of funds, damages, or interruptions caused by user actions or third parties. Use of our system is entirely at your own risk." },
  { title: "12. Termination", content: "We reserve the right to suspend or delete accounts that violate our policies or misuse our services." },
  { title: "13. Changes to Terms", content: "These Terms and Policies may be updated periodically. Continued use of the website constitutes acceptance of updated terms." },
  { title: "14. Contact Us", content: "📧 support@fundraisingsystem.com\n📍 Fundraising System Headquarters, Your City, Your Country" },
];

export default function Terms() {
  return (
    <div>
      
      <div className="container" style={{ maxWidth: 900, padding: "2rem 20px" }}>
        <div style={{ background: "white", borderRadius: 12, boxShadow: "0 4px 10px rgba(0,0,0,0.1)", padding: "2rem" }}>
          {sections.map(s => (
            <div key={s.title} style={{ marginTop: "2rem" }}>
              <h2 style={{ color: "#0a4d68", borderLeft: "4px solid #0a4d68", paddingLeft: 10, fontSize: "1.1rem" }}>{s.title}</h2>
              {s.content && <p style={{ color: "#555", fontSize: "0.95rem", marginTop: 10, lineHeight: 1.7, whiteSpace: "pre-line" }}>{s.content}</p>}
              {s.items && (
                <ul style={{ marginLeft: 20, marginTop: 10 }}>
                  {s.items.map((item, i) => (
                    <li key={i} style={{ color: "#555", fontSize: "0.95rem", marginBottom: 6, lineHeight: 1.6 }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background: "#0a4d68", color: "white", textAlign: "center", padding: "1rem", marginTop: "3rem" }}>
        <p>© 2025 Fundraising System. All Rights Reserved. |{" "}
          <Link to="/" style={{ color: "white", textDecoration: "underline" }}>Back to Home</Link>
        </p>
      </footer>
    </div>
  );
}

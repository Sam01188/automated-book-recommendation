import { useState } from "react";
import { LogIn, ArrowRight } from "lucide-react";
import { AppModal } from "../../components/AppModal";

export function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@ruh.ac.lk");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onLogin(email, password);
    } catch (error) {
      setModal({
        title: "Login failed",
        message: error.message || "Please check your email and password."
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="radical-login-page">
      <div className="login-visual">
        <img src="/ruhuna.gif" alt="Logo" style={{ width: '80px', marginBottom: '2rem' }} />
        <h2>Engineering Library Portal</h2>
        <p>A smart priority-based recommendation system for the Faculty of Engineering, University of Ruhuna.</p>
        
        <div style={{ marginTop: 'auto', display: 'flex', gap: '2rem' }}>
          <div>
            <h4 style={{ fontSize: '1.5rem' }}>1.2k+</h4>
            <span style={{ opacity: 0.6 }}>Books Recommended</span>
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem' }}>45+</h4>
            <span style={{ opacity: 0.6 }}>Active Faculty</span>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <form className="radical-login-card" onSubmit={submit}>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome back</h3>
            <p style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Please enter your credentials to continue.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="field-radical">
              <label>Institutional Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(event) => setEmail(event.target.value)} 
                placeholder="name@ruh.ac.lk"
              />
            </div>
            <div className="field-radical">
              <label>Secure Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(event) => setPassword(event.target.value)} 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button className="btn-radical" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign In"}
            {!busy && <ArrowRight size={20} />}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            <a href="#help" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              Need technical assistance?
            </a>
          </div>
        </form>
      </div>

      {modal && (
        <AppModal
          title={modal.title}
          message={modal.message}
          onConfirm={() => setModal(null)}
        />
      )}
    </div>
  );
}

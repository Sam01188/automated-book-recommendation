import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { AppModal } from "../../components/AppModal";

export function LoginPage({ onLogin, onRequestPasswordReset, onResetPassword, resetToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");

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

  async function requestReset(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const result = await onRequestPasswordReset(email);
      setNotice(result.message);
    } catch (error) {
      setModal({ title: "Could not send reset email", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setModal({ title: "Passwords do not match", message: "Enter the same new password in both fields." });
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const result = await onResetPassword(resetToken, newPassword);
      window.history.replaceState({}, "", window.location.pathname);
      setMode("login");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(result.message);
    } catch (error) {
      setModal({ title: "Could not reset password", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  const modeTitle = {
    login: "Welcome back",
    forgot: "Reset your password",
    reset: "Choose a new password"
  }[mode];

  return (
    <div className="login-page">
      <div className="login-visual">
        <img src="/ruhuna.gif" alt="Logo" style={{ width: '80px', marginBottom: '2rem' }} />
        <h2>Library Book Recommendation Portal</h2>
        <p>A centralized platform for managing book recommendations and departmental prioritizations of the Faculty of Engineering, University of Ruhuna.</p>

        <div style={{ marginTop: 'auto', display: 'flex', gap: '2rem' }}>
          <div>
            <h4 style={{ fontSize: '1.5rem' }}>1.2k+</h4>
            <span style={{ opacity: 0.6 }}>Books Recommended</span>
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem' }}>45+</h4>
            <span style={{ opacity: 0.6 }}>Active Members</span>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <form
          className="login-card"
          onSubmit={mode === "login" ? submit : mode === "forgot" ? requestReset : submitReset}
        >
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{modeTitle}</h3>
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              {mode === "login" && "Please enter your credentials to continue."}
              {mode === "forgot" && "Enter your account email and we will send a reset link."}
              {mode === "reset" && "Use at least 6 characters for your new password."}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {(mode === "login" || mode === "forgot") && (
              <div className="field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@ruh.ac.lk"
                />
              </div>
            )}
            {mode === "login" && (
              <div className="field">
                <label htmlFor="login-password">Password</label>
                <div className="password-input-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    className="password-visibility-toggle"
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}
            {mode === "reset" && (
              <>
                <div className="field">
                  <label htmlFor="reset-password">New password</label>
                  <input id="reset-password" type="password" autoComplete="new-password" minLength={6} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </div>
              </>
            )}
          </div>

          {notice && <p className="login-notice" role="status">{notice}</p>}

          {mode === "login" && (
            <>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "Signing in..." : "Sign In"}
                {!busy && <ArrowRight size={20} />}
              </button>
              <button className="link-button" type="button" onClick={() => { setNotice(""); setMode("forgot"); }}>
                Forgot password?
              </button>
            </>
          )}
          {mode === "forgot" && (
            <>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "Sending..." : "Send reset link"}
              </button>
              <button className="link-button" type="button" onClick={() => { setNotice(""); setMode("login"); }}>
                Back to sign in
              </button>
            </>
          )}
          {mode === "reset" && (
            <>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "Updating..." : "Reset password"}
              </button>
              <button className="link-button" type="button" onClick={() => { window.history.replaceState({}, "", window.location.pathname); setMode("login"); }}>
                Back to sign in
              </button>
            </>
          )}
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

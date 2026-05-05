import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";

export function LoginPage({ onLogin }: { onLogin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState("lecturer");
  const [password, setPassword] = useState("lecturer123");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await onLogin(username, password);
    setBusy(false);
  }

  return (
    <div className="login-screen">
      <header className="topbar login-topbar">
        <div className="brand">
          <img src="/ruhuna.gif" alt="University of Ruhuna" className="logo" />
          <div>
            <h1>University of Ruhuna - Engineering Library</h1>
            <p>Book Recommendation System</p>
          </div>
        </div>
      </header>
      <form className="login-card" onSubmit={submit}>
        <h2>Login</h2>
        <label>
          <span>Username</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          <LogIn size={14} />
          {busy ? "Signing in" : "Login"}
        </button>
        <p className="hint">Try lecturer/lecturer123, hod/hod123, or librarian/library123</p>
        <a href="#forgot">Forgot Password?</a>
      </form>
      <footer className="footer">
        <span>© 2026 University of Ruhuna</span>
        <span>Version 1.0</span>
      </footer>
    </div>
  );
}

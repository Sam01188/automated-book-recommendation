import { useState } from "react";

export function CreateUserPage({ onCreateUser }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "lecturer", department: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await onCreateUser(form);
      setForm({ name: "", email: "", password: "", role: "lecturer", department: "" });
      alert("User created successfully!");
    } catch (err) {
      alert(err.message || "Failed to create user");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={submit}>
      <h2 className="panel-title">Onboard New User</h2>
      <div className="form-grid">
        <div className="field">
          <label>Full Name *</label>
          <input value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter name" />
        </div>
        <div className="field">
          <label>Email Address *</label>
          <input type="email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@ruh.ac.lk" />
        </div>
        <div className="field">
          <label>Initial Password *</label>
          <input type="password" value={form.password} required onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </div>
        <div className="field">
          <label>System Role *</label>
          <select value={form.role} required onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="lecturer">Lecturer</option>
            <option value="hod">HOD</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {(form.role === "lecturer" || form.role === "hod") && (
          <div className="field">
            <label>Department *</label>
            <input value={form.department} required onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. DCEE" />
          </div>
        )}
      </div>
      <div className="actions" style={{ marginTop: '2rem' }}>
        <button className="primary-button" type="submit" disabled={busy} style={{ minWidth: '160px' }}>
          {busy ? "Processing..." : "Create Account"}
        </button>
      </div>
    </form>
  );
}

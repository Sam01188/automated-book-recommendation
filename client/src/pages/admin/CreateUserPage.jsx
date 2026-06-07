import { useState, useRef } from "react";
import { AppModal } from "../../components/AppModal";

const departments = ["DCEE","DEIE","DMME","DMENA","DCE"];

function roleHasDepartment(role) {
  return role === "lecturer" || role === "hod";
}

export function CreateUserPage({ onCreateUser }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "lecturer",
    department: "DCEE"
  });
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [emailError, setEmailError] = useState("");
  const emailInputRef = useRef(null);

  async function submit(e) {
    e.preventDefault();
    
    // Validate email domain
    if (!form.email.endsWith("@ruh.ac.lk")) {
      setEmailError("Please enter a valid email address (name@ruh.ac.lk)");
      emailInputRef.current?.focus();
      return;
    }
    
    setEmailError("");
    
    setBusy(true);

    try {
      const payload = {
        ...form,
        department: roleHasDepartment(form.role) ? form.department : ""
      };

      await onCreateUser(payload);
      
      // Log the creation activity
      const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
      activities.push({
        type: 'create',
        userId: `new-${Date.now()}`,
        userName: form.name,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('userActivities', JSON.stringify(activities.slice(-20)));
      
      setForm({ name: "", email: "", password: "", role: "lecturer", department: "DCEE" });
      setModal({
        title: "Account created successfully.",
        message: "The new user can now sign in with the credentials you provided."
      });
    } catch (err) {
      setModal({
        title: "Failed to create user",
        message: err.message || "Please check the details and try again."
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="form-panel" onSubmit={submit}>
        <h2 className="panel-title">New User</h2>
        <div className="form-grid">
          <div className="field">
            <label>Full Name *</label>
            <input value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter name" />
          </div>

          <div className="field">
            <label>Email Address *</label>
            <input ref={emailInputRef} type="email" value={form.email} required onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              setEmailError("");
            }} placeholder="name@ruh.ac.lk" />
            {emailError && <div style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>{emailError}</div>}
          </div>

          <div className="field">
            <label>Initial Password *</label>
            <input type="password" value={form.password} required onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
          </div>

          <div className="field">
            <label>System Role *</label>
            <select
              value={form.role}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                  department: roleHasDepartment(e.target.value) ? form.department || "DCEE" : ""
                })
              }
            >
              <option value="lecturer">Lecturer</option>
              <option value="hod">HoD</option>
              <option value="librarian">Librarian</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {roleHasDepartment(form.role) && (
            <div className="field">
              <label>Department *</label>
              <select value={form.department} required onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="actions" style={{ marginTop: "2rem" }}>
          <button className="primary-button" type="submit" disabled={busy} style={{ minWidth: "160px" }}>
            {busy ? "Processing..." : "Create Account"}
          </button>
        </div>
      </form>

      {modal && (
        <AppModal
          title={modal.title}
          message={modal.message}
          onConfirm={() => setModal(null)}
        />
      )}
    </>
  );
}

import { useState, useRef } from "react";
import { AppModal } from "../../components/AppModal";
import { UserCsvImportPanel } from "./UserCsvImportPanel";

const departments = ["DCEE","DEIE","DMME","DMENA"];

function roleHasDepartment(role) {
  return role === "lecturer" || role === "hod";
}

export function CreateUserPage({ onCreateUser, onImportUsers, token }) {
  const [mode, setMode] = useState("single");
  const [form, setForm] = useState({
    name: "",
    email: "",
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

      setForm({ name: "", email: "", role: "lecturer", department: "DCEE" });
      setModal({
        title: "Account created successfully.",
        message: "A temporary password has been sent to the user by email."
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
      <div className="user-create-mode" role="tablist" aria-label="User creation method">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "single"}
          className={mode === "single" ? "user-create-mode-button active" : "user-create-mode-button"}
          onClick={() => setMode("single")}
        >
          Single account
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "csv"}
          className={mode === "csv" ? "user-create-mode-button active" : "user-create-mode-button"}
          onClick={() => setMode("csv")}
        >
          CSV import
        </button>
      </div>

      {mode === "single" ? (
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
            <label>Temporary password</label>
            <div
              style={{
                minHeight: "52px",
                display: "flex",
                alignItems: "center",
                borderRadius: "0.75rem",
                padding: "0.9rem 1rem",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: "1.05rem"
              }}
            >
              Sent automatically by email
            </div>
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
      ) : (
        <UserCsvImportPanel token={token} onImportUsers={onImportUsers} />
      )}

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

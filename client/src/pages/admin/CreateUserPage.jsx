import { useState } from "react";
import { AppModal } from "../../components/AppModal";

const departments = ["DCEE", "DEIE", "DMME", "DMENA", "DCE"];

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

  async function submit(e) {
    e.preventDefault();
    setBusy(true);

    try {
      const payload = {
        ...form,
        department: form.role === "lecturer" || form.role === "hod" ? form.department : ""
      };

      await onCreateUser(payload);
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
            <input type="email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@ruh.ac.lk" />
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
                  department: e.target.value === "lecturer" || e.target.value === "hod" ? form.department || "DCEE" : ""
                })
              }
            >
              <option value="lecturer">Lecturer</option>
              <option value="hod">HoD</option>
              <option value="librarian">Librarian</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(form.role === "lecturer" || form.role === "hod") && (
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

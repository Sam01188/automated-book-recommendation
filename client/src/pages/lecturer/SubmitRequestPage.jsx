import { useState } from "react";

const EMPTY_FORM = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  edition: "",
  publicationYear: "",
  binding: "",
  agreeLatest: "",
  price: "",
  copies: "",
  additionalNotes: ""
};

export function SubmitRequestPage({ onSubmit, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [success, setSuccess] = useState(false);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await onSubmit(form);
      setSuccess(true);
      setForm(EMPTY_FORM);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  }

  return (
    <div style={{
      background: "var(--surface-solid)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow)",
      padding: "2.5rem",
      maxWidth: 860,
    }}>
      <h2 style={{
        fontSize: "1rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "var(--text)",
        marginBottom: "2rem"
      }}>
        Submit Book Recommendation
      </h2>

      {success && (
        <div style={{
          background: "var(--success-bg)",
          color: "var(--success-text)",
          borderRadius: "var(--radius)",
          padding: "0.875rem 1.25rem",
          fontWeight: 600,
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
          border: "1px solid var(--success-border)"
        }}>
          ✓ Recommendation submitted successfully! View it in My Requests.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={gridStyle}>
          <Field label="Book Title" required>
            <input value={form.title} required placeholder="Enter book title"
              onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Author" required>
            <input value={form.author} required placeholder="Enter author name"
              onChange={(e) => set("author", e.target.value)} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="ISBN" required>
            <input value={form.isbn} required placeholder="978-XXXXXXXXXX"
              onChange={(e) => set("isbn", e.target.value)} />
          </Field>
          <Field label="Publisher" required>
            <input value={form.publisher} required placeholder="Enter publisher name"
              onChange={(e) => set("publisher", e.target.value)} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Edition" required>
            <input value={form.edition} required placeholder="e.g., 3rd edition"
              onChange={(e) => set("edition", e.target.value)} />
          </Field>
          <Field label="Publication Year">
            <input type="number" value={form.publicationYear} placeholder="e.g., 2024"
              min="1900" max="2099" onChange={(e) => set("publicationYear", e.target.value)} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Binding Type (Hb / Pb)">
            <select value={form.binding} onChange={(e) => set("binding", e.target.value)}>
              <option value="">Select binding type</option>
              <option value="Hb">Hardback (Hb)</option>
              <option value="Pb">Paperback (Pb)</option>
              <option value="Hb/Pb">Both (Hb/Pb)</option>
            </select>
          </Field>
          <Field label="Agree on Latest / Cheapest Edition">
            <select value={form.agreeLatest} onChange={(e) => set("agreeLatest", e.target.value)}>
              <option value="">Select option</option>
              <option value="A">A – Agree</option>
              <option value="NA">NA – Not Agree</option>
            </select>
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Price (LKR)">
            <input type="number" value={form.price} placeholder="e.g., 15000"
              min="0" onChange={(e) => set("price", e.target.value)} />
          </Field>
          <Field label="No. of Copies">
            <input type="number" value={form.copies} placeholder="e.g., 2"
              min="1" onChange={(e) => set("copies", e.target.value)} />
          </Field>
        </div>

        <div style={{ marginTop: "0.25rem" }}>
          <Field label="Additional Notes (Optional)">
            <textarea value={form.additionalNotes} rows={4}
              placeholder="Any additional information about this book recommendation"
              onChange={(e) => set("additionalNotes", e.target.value)}
              style={{ resize: "vertical" }} />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.875rem", marginTop: "2rem" }}>
          <button type="button" className="secondary-button"
            onClick={() => setForm(EMPTY_FORM)} disabled={loading}>
            Clear Form
          </button>
          <button type="submit" className="primary-button"
            disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? "Submitting…" : "Submit Recommendation"}
          </button>
        </div>
      </form>
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1.5rem",
  marginBottom: "1.5rem"
};

function Field({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
        {label}
        {required && <span style={{ color: "var(--danger-text)", marginLeft: "0.2rem" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

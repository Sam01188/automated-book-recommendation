import { useState } from "react";
import { AppModal } from "../../components/AppModal";

const EMPTY_FORM = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  edition: "",
  publicationYear: "",
  binding: "",
  agreeLatest: "",
  publishPlace: "",
  price: "",
  currency: "LKR",
  copies: "",
  numberOfPages: "",
  additionalNotes: ""
};

export function SubmitRequestPage({ onSubmit, loading, isPeriodOpen, currentPeriod }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [success, setSuccess] = useState(false);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isPeriodOpen) {
      setModal({ title: "Submissions Closed", message: "Submissions are currently closed.", confirmText: "OK", onConfirm: () => setModal(null) });
      return;
    }
    try {
      await onSubmit(form);
      setSuccess(true);
      setForm(EMPTY_FORM);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  }

  const [modal, setModal] = useState(null);

  const isFormDisabled = loading || !isPeriodOpen;

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-panel">
        <h2 className="panel-title">Submit Book Recommendation</h2>

        {!isPeriodOpen && (
          <div style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)",
            color: "var(--danger)",
            borderRadius: "var(--radius)",
            padding: "1rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(239, 68, 68, 0.35)"
          }}>
            ⚠️ Book recommendation submissions are currently closed. You cannot submit new recommendations at this time.
          </div>
        )}

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

        <div style={gridStyle}>
          <Field label="Book Title" required>
            <input value={form.title} required placeholder="Enter book title"
              onChange={(e) => set("title", e.target.value)} disabled={isFormDisabled} />
          </Field>
          <Field label="Author" required>
            <input value={form.author} required placeholder="Last Name, First Name (e.g., Smith, John)"
              onChange={(e) => set("author", e.target.value)} disabled={isFormDisabled} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="ISBN" required>
            <input value={form.isbn} required placeholder="978-XXXXXXXXXX"
              onChange={(e) => set("isbn", e.target.value)} disabled={isFormDisabled} />
          </Field>
          <Field label="Publisher" required>
            <input value={form.publisher} required placeholder="Enter publisher name"
              onChange={(e) => set("publisher", e.target.value)} disabled={isFormDisabled} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Publisher Place">
            <input value={form.publisherPlace} placeholder="Enter publisher place"
              onChange={(e) => set("publisherPlace", e.target.value)} disabled={isFormDisabled} />
          </Field>
          <Field label="Edition" required>
            <input value={form.edition} required placeholder="e.g., 3rd edition"
              onChange={(e) => set("edition", e.target.value)} disabled={isFormDisabled} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Binding Type (Hb / Pb)">
            <select value={form.binding} onChange={(e) => set("binding", e.target.value)} disabled={isFormDisabled}>
              <option value="">Select binding type</option>
              <option value="Hb">Hardback (Hb)</option>
              <option value="Pb">Paperback (Pb)</option>
              <option value="Hb/Pb">Any (Hb/Pb)</option>
            </select>
          </Field>
          <Field label="Agree on Latest / Cheapest Edition">
            <select value={form.agreeLatest} onChange={(e) => set("agreeLatest", e.target.value)} disabled={isFormDisabled}>
              <option value="">Select option</option>
              <option value="A">Agree</option>
              <option value="NA">Disagree</option>
            </select>
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Publication Year">
            <input type="number" value={form.publicationYear} placeholder="e.g., 2024"
              min="1900" max="2099" onChange={(e) => set("publicationYear", e.target.value)} disabled={isFormDisabled} />
          </Field>
          <Field label="Number of Pages">
            <input type="number" value={form.numberOfPages} placeholder="e.g., 256"
              min="1" onChange={(e) => set("numberOfPages", e.target.value)} disabled={isFormDisabled} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Price">
            <div className="price-input-group">
              <select
                className="currency-prefix"
                aria-label="Currency"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                disabled={isFormDisabled}
              >
                <option value="LKR">LKR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
              <input type="number" value={form.price} placeholder="e.g., 15000"
                min="0" onChange={(e) => set("price", e.target.value)} disabled={isFormDisabled} />
            </div>
          </Field>
          <Field label="No. of Copies">
            <input type="number" value={form.copies} placeholder="e.g., 2"
              min="1" onChange={(e) => set("copies", e.target.value)} disabled={isFormDisabled} />
          </Field>
        </div>

        <div style={{ marginTop: "0.25rem" }}>
          <Field label="Additional Notes (Optional)">
            <textarea value={form.additionalNotes} rows={4}
              placeholder="Any additional information about this book recommendation"
              onChange={(e) => set("additionalNotes", e.target.value)}
              disabled={isFormDisabled}
              style={{ resize: "vertical" }} />
          </Field>
        </div>

      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.875rem", marginTop: "-0.5rem" }}>
        <button type="button" className="secondary-button"
          onClick={() => setForm(EMPTY_FORM)} disabled={isFormDisabled}>
          Clear Form
        </button>
        <button type="submit" className="primary-button"
          disabled={isFormDisabled} style={{ opacity: isFormDisabled ? 0.7 : 1 }}>
          {loading ? "Submitting…" : "Submit Recommendation"}
        </button>
      </div>
      {modal && (
        <AppModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}
    </form>
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

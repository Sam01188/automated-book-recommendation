import { useState } from "react";

const EMPTY_FORM = {
  title: "",
  author: "",
  isbn10: "",
  isbn13: "",
  publisher: "",
  publishingPlace: "",
  edition: "",
  publicationYear: "",
  binding: "",
  agreeLatest: "",
  currency: "LKR",
  price: "",
  copies: "",
  pages: "",
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

    // Mandatory checks (all except isbn10, pages, additionalNotes)
    if (!form.title.trim()) return alert("Please enter the book title.");
    if (!form.author.trim()) return alert("Please enter the author's last name.");
    if (!form.isbn13.trim()) return alert("Please provide the ISBN-13.");
    if (!form.publisher.trim()) return alert("Please enter the publisher.");
    if (!form.publishingPlace.trim()) return alert("Please enter the publishing place.");
    if (!form.edition.trim()) return alert("Please enter the edition.");
    if (!form.publicationYear) return alert("Please enter the publication year.");
    if (!form.binding) return alert("Please select the binding type.");
    if (!form.agreeLatest) return alert("Please select Agree/NA option.");
    if (!form.currency || !form.price) return alert("Please enter price and choose currency.");
    if (!form.copies) return alert("Please enter number of copies.");

    try {
      const payload = { ...form };
      await onSubmit(payload);
      setSuccess(true);
      setForm(EMPTY_FORM);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  }

  return (
    <div style={{
      background: "var(--surface)",
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
          background: "#dcfce7",
          color: "#166534",
          borderRadius: "var(--radius)",
          padding: "0.875rem 1.25rem",
          fontWeight: 600,
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
          border: "1px solid #bbf7d0"
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
          <Field label="Author's Last Name" required>
            <input value={form.author} required placeholder="Enter author's last name"
              onChange={(e) => set("author", e.target.value)} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="ISBN-10 (optional)">
            <input value={form.isbn10} placeholder="e.g., 0123456789"
              onChange={(e) => set("isbn10", e.target.value)} />
          </Field>
          <Field label="ISBN-13" required>
            <input value={form.isbn13} required placeholder="e.g., 9780123456786"
              onChange={(e) => set("isbn13", e.target.value)} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Publisher" required>
            <input value={form.publisher} required placeholder="Enter publisher name"
              onChange={(e) => set("publisher", e.target.value)} />
          </Field>
          <Field label="Publishing Place" required>
            <input value={form.publishingPlace} required placeholder="City / Place of publication"
              onChange={(e) => set("publishingPlace", e.target.value)} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Edition" required>
            <input value={form.edition} required placeholder="e.g., 3rd edition"
              onChange={(e) => set("edition", e.target.value)} />
          </Field>
          <Field label="Publication Year" required>
            <input type="number" value={form.publicationYear} required placeholder="e.g., 2024"
              min="1900" max="2099" onChange={(e) => set("publicationYear", e.target.value)} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Binding Type (Hb / Pb)" required>
            <select value={form.binding} required onChange={(e) => set("binding", e.target.value)}>
              <option value="">Select binding type</option>
              <option value="Hb">Hardback (Hb)</option>
              <option value="Pb">Paperback (Pb)</option>
              <option value="Hb/Pb">Both (Hb/Pb)</option>
            </select>
          </Field>
          <Field label="Agree on Latest / Cheapest Edition" required>
            <select value={form.agreeLatest} required onChange={(e) => set("agreeLatest", e.target.value)}>
              <option value="">Select option</option>
              <option value="A">A – Agree</option>
              <option value="NA">NA – Not Agree</option>
            </select>
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Price" required>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select value={form.currency} required onChange={(e) => set("currency", e.target.value)}>
                <option value="LKR">LKR - Sri Lankan Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                <option value="NZD">NZD - New Zealand Dollar</option>
                <option value="ZAR">ZAR - South African Rand</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="PKR">PKR - Pakistani Rupee</option>
                <option value="BDT">BDT - Bangladeshi Taka</option>
                <option value="NOK">NOK - Norwegian Krone</option>
                <option value="CHF">CHF - Swiss Franc</option>
                <option value="SEK">SEK - Swedish Krona</option>
                <option value="MXN">MXN - Mexican Peso</option>
                <option value="BRL">BRL - Brazilian Real</option>
                <option value="KRW">KRW - South Korean Won</option>
                <option value="TRY">TRY - Turkish Lira</option>
                <option value="IDR">IDR - Indonesian Rupiah</option>
                <option value="HKD">HKD - Hong Kong Dollar</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="ILS">ILS - Israeli Shekel</option>
                <option value="PLN">PLN - Polish Zloty</option>
                <option value="THB">THB - Thai Baht</option>
                <option value="VND">VND - Vietnamese Dong</option>
                <option value="HUF">HUF - Hungarian Forint</option>
                <option value="RON">RON - Romanian Leu</option>
              </select>
              <input type="number" value={form.price} required placeholder="e.g., 15000"
                min="0" onChange={(e) => set("price", e.target.value)} />
            </div>
          </Field>
          <Field label="No. of Copies" required>
            <input type="number" value={form.copies} required placeholder="e.g., 2"
              min="1" onChange={(e) => set("copies", e.target.value)} />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="No. of Pages (Optional)">
            <input type="number" value={form.pages} placeholder="e.g., 320"
              min="1" onChange={(e) => set("pages", e.target.value)} />
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
        {required && <span style={{ color: "#dc2626", marginLeft: "0.2rem" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

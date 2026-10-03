import { useEffect, useState } from "react";
import { AppModal } from "../../components/AppModal";
import { getBookSuggestion } from "../../api";

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
  numberOfPages: "",
  additionalNotes: ""
};

export function SubmitRequestPage({ onSubmit, loading, isPeriodOpen, currentPeriod }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [success, setSuccess] = useState(false);
  const [modal, setModal] = useState(null);
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestionInput, setSuggestionInput] = useState({ query: "", field: "title" });

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    const query = suggestionInput.query.trim();
    if (query.length < 3) {
      setBookSuggestions([]);
      setAiLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const result = await getBookSuggestion(query, suggestionInput.field, controller.signal);
        setBookSuggestions(result.suggestions || []);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Book search failed:", err);
      } finally {
        if (!controller.signal.aborted) setAiLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [suggestionInput]);

  function chooseBookSuggestion(book) {
    setForm((prev) => ({
      ...prev,
      title: book.title || prev.title,
      author: book.author || prev.author,
      publisher: book.publisher || prev.publisher,
      isbn13: book.isbn13 || prev.isbn13,
      isbn10: book.isbn10 || prev.isbn10
    }));
    setBookSuggestions([]);
    setSuggestionInput({ query: "", field: "title" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isPeriodOpen) {
      setModal({
        title: "Submissions Closed",
        message: "Submissions are currently closed.",
        confirmText: "OK",
        onConfirm: () => setModal(null)
      });
      return;
    }

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

  const isFormDisabled = loading || !isPeriodOpen;

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-panel">
        <h2 className="panel-title" style={{ marginBottom: "0.5rem" }}>Submit Book Recommendation</h2>

        <p style={{ margin: "0 0 1.5rem", color: "var(--text-muted, #64748b)", fontSize: "0.86rem" }}>
          Fields marked in <span style={{ color: "var(--danger-text, #dc2626)" }}>*</span> are required.
        </p>

        {aiLoading && (
          <div
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              color: "var(--primary)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.86rem",
              fontWeight: 600
            }}
          >
            Searching book records…
          </div>
        )}

        {bookSuggestions.length > 0 && !aiLoading && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.08)",
              color: "var(--success-text)",
              border: "1px solid var(--success-border)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.86rem",
              display: "flex",
              justifyContent: "space-between",
              gap: "0.75rem",
              flexWrap: "wrap",
              alignItems: "center"
            }}
          >
            <div style={{ width: "100%" }}>
              <strong style={{ display: "block", marginBottom: "0.5rem" }}>Book matches</strong>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {bookSuggestions.map((book, index) => (
                  <button
                    key={`${book.title}-${book.isbn13 || index}`}
                    type="button"
                    className="secondary-button"
                    onClick={() => chooseBookSuggestion(book)}
                    style={{ textAlign: "left", whiteSpace: "normal" }}
                  >
                    <strong>{book.title}</strong>
                    {book.author ? ` · ${book.author}` : ""}
                    {book.publisher ? ` · ${book.publisher}` : ""}
                  </button>
                ))}
              </div>
              <small style={{ display: "block", marginTop: "0.5rem" }}>Catalog matches from Open Library. Check details before submitting.</small>
            </div>
          </div>
        )}

        {!isPeriodOpen && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)",
              color: "var(--danger)",
              borderRadius: "var(--radius)",
              padding: "1rem 1.25rem",
              fontWeight: 600,
              fontSize: "0.95rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(239, 68, 68, 0.35)"
            }}
          >
            ⚠️ Book recommendation submissions are currently closed. You cannot submit new recommendations at this time.
          </div>
        )}

        {success && (
          <div
            style={{
              background: "var(--success-bg)",
              color: "var(--success-text)",
              borderRadius: "var(--radius)",
              padding: "0.875rem 1.25rem",
              fontWeight: 600,
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              border: "1px solid var(--success-border)"
            }}
          >
            ✓ Recommendation submitted successfully! View it in My Requests.
          </div>
        )}

        <div style={gridStyle}>
          <Field label="Book Title" required>
            <input
              value={form.title}
              required
              placeholder="Enter book title"
              onChange={(e) => {
                set("title", e.target.value);
                setSuggestionInput({ query: e.target.value, field: "title" });
              }}
              disabled={isFormDisabled}
            />
          </Field>
          <Field label="Author" required>
            <input
              value={form.author}
              required
              placeholder="Last Name, First Name (e.g., Smith, John)"
              onChange={(e) => {
                set("author", e.target.value);
                setSuggestionInput({ query: e.target.value, field: "author" });
              }}
              disabled={isFormDisabled}
            />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="ISBN-10 (optional)">
            <input
              value={form.isbn10}
              placeholder="e.g., 0123456789"
              onChange={(e) => set("isbn10", e.target.value)}
              disabled={isFormDisabled}
            />
          </Field>
          <Field label="ISBN-13" required>
            <input
              value={form.isbn13}
              required
              placeholder="e.g., 9780123456786"
              onChange={(e) => set("isbn13", e.target.value)}
              disabled={isFormDisabled}
            />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Publisher" required>
            <input
              value={form.publisher}
              required
              placeholder="Enter publisher name"
              onChange={(e) => {
                set("publisher", e.target.value);
                setSuggestionInput({ query: e.target.value, field: "publisher" });
              }}
              disabled={isFormDisabled}
            />
          </Field>
          <Field label="Publishing Place" required>
            <input
              value={form.publishingPlace}
              required
              placeholder="City / Place of publication"
              onChange={(e) => set("publishingPlace", e.target.value)}
              disabled={isFormDisabled}
            />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Edition" required>
            <input
              value={form.edition}
              required
              placeholder="e.g., 3rd edition"
              onChange={(e) => set("edition", e.target.value)}
              disabled={isFormDisabled}
            />
          </Field>
          <Field label="Publication Year" required>
            <input
              type="number"
              value={form.publicationYear}
              required
              placeholder="e.g., 2024"
              min="1900"
              max="2099"
              onChange={(e) => set("publicationYear", e.target.value)}
              disabled={isFormDisabled}
            />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Binding Type (Hb / Pb)" required>
            <select
              value={form.binding}
              required
              onChange={(e) => set("binding", e.target.value)}
              disabled={isFormDisabled}
            >
              <option value="">Select binding type</option>
              <option value="Hb">Hardback (Hb)</option>
              <option value="Pb">Paperback (Pb)</option>
              <option value="Hb/Pb">Any (Hb/Pb)</option>
            </select>
          </Field>
          <Field label="Agree on Latest / Cheapest Edition" required>
            <select
              value={form.agreeLatest}
              required
              onChange={(e) => set("agreeLatest", e.target.value)}
              disabled={isFormDisabled}
            >
              <option value="">Select option</option>
              <option value="A">Agree</option>
              <option value="NA">Disagree</option>
            </select>
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Number of Pages (Optional)">
            <input
              type="number"
              value={form.numberOfPages}
              placeholder="e.g., 256"
              min="1"
              onChange={(e) => set("numberOfPages", e.target.value)}
              disabled={isFormDisabled}
            />
          </Field>
          <Field label="No. of Copies" required>
            <input
              type="number"
              value={form.copies}
              required
              placeholder="e.g., 2"
              min="1"
              onChange={(e) => set("copies", e.target.value)}
              disabled={isFormDisabled}
            />
          </Field>
        </div>

        <div style={gridStyle}>
          <Field label="Price" required>
            <div style={{ display: "flex", gap: "0.5rem" }} className="price-input-group">
              <select
                value={form.currency}
                required
                onChange={(e) => set("currency", e.target.value)}
                disabled={isFormDisabled}
              >
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
              <input
                type="number"
                value={form.price}
                required
                placeholder="e.g., 15000"
                min="0"
                onChange={(e) => set("price", e.target.value)}
                disabled={isFormDisabled}
              />
            </div>
          </Field>
        </div>

        <div style={{ marginTop: "0.25rem" }}>
          <Field label="Additional Notes (Optional)">
            <textarea
              value={form.additionalNotes}
              rows={4}
              placeholder="Any additional information about this book recommendation"
              onChange={(e) => set("additionalNotes", e.target.value)}
              disabled={isFormDisabled}
              style={{ resize: "vertical" }}
            />
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.875rem", marginTop: "-0.5rem" }}>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            const hasData = Object.values(form).some((value) => String(value ?? "").trim() !== "");
            if (hasData && !window.confirm("Clear all entered information in this form?")) {
              return;
            }
            setForm(EMPTY_FORM);
          }}
          disabled={isFormDisabled}
        >
          Clear Form
        </button>
        <button type="submit" className="primary-button" disabled={isFormDisabled} style={{ opacity: isFormDisabled ? 0.7 : 1 }}>
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
  gridTemplateColumns: "1fr",
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

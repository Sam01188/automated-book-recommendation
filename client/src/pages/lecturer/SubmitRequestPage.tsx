import { useState } from "react";
import type { Recommendation } from "../../types";

export function SubmitRequestPage({ onSubmit }: { onSubmit: (payload: Partial<Recommendation>) => void }) {
  const [form, setForm] = useState({ title: "", author: "", isbn: "", publisher: "", edition: "", additionalNotes: "" });

  return (
    <form
      className="form-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
        setForm({ title: "", author: "", isbn: "", publisher: "", edition: "", additionalNotes: "" });
      }}
    >
      <h2>Submit Book Recommendation</h2>
      <div className="form-grid">
        <TextField label="Book Title" value={form.title} required onChange={(title) => setForm({ ...form, title })} />
        <TextField label="Author" value={form.author} required onChange={(author) => setForm({ ...form, author })} />
        <TextField label="ISBN" value={form.isbn} onChange={(isbn) => setForm({ ...form, isbn })} />
        <TextField label="Publisher" value={form.publisher} required onChange={(publisher) => setForm({ ...form, publisher })} />
        <TextField label="Edition" value={form.edition} onChange={(edition) => setForm({ ...form, edition })} />
      </div>
      <label className="field span-all">
        <span>Additional Notes</span>
        <textarea value={form.additionalNotes} onChange={(event) => setForm({ ...form, additionalNotes: event.target.value })} placeholder="Add justification or module relevance" />
      </label>
      <div className="actions">
        <button className="primary-button" type="submit">Submit Recommendation</button>
        <button className="secondary-button" type="button" onClick={() => setForm({ title: "", author: "", isbn: "", publisher: "", edition: "", additionalNotes: "" })}>Clear Form</button>
      </div>
    </form>
  );
}

function TextField({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="field">
      <span>{label}{required ? " *" : ""}</span>
      <input value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

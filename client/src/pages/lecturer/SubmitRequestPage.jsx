import { useState } from "react";

export function SubmitRequestPage({ onSubmit }) {
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
      <h2 className="panel-title">Submit Recommendation</h2>
      <div className="form-grid">
        <TextField label="Book Title" value={form.title} required onChange={(title) => setForm({ ...form, title })} />
        <TextField label="Author" value={form.author} required onChange={(author) => setForm({ ...form, author })} />
        <TextField label="ISBN" value={form.isbn} onChange={(isbn) => setForm({ ...form, isbn })} />
        <TextField label="Publisher" value={form.publisher} required onChange={(publisher) => setForm({ ...form, publisher })} />
        <TextField label="Edition" value={form.edition} onChange={(edition) => setForm({ ...form, edition })} />
      </div>
      <div className="field" style={{ marginTop: '1.5rem' }}>
        <label>Additional Notes</label>
        <textarea 
          value={form.additionalNotes} 
          onChange={(event) => setForm({ ...form, additionalNotes: event.target.value })} 
          placeholder="Add justification or module relevance" 
        />
      </div>
      <div className="actions" style={{ marginTop: '2rem' }}>
        <button className="secondary-button" type="button" onClick={() => setForm({ title: "", author: "", isbn: "", publisher: "", edition: "", additionalNotes: "" })}>Clear</button>
        <button className="primary-button" type="submit">Submit Request</button>
      </div>
    </form>
  );
}

function TextField({ label, value, onChange, required }) {
  return (
    <div className="field">
      <label>{label}{required ? " *" : ""}</label>
      <input value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

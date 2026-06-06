import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { Button } from "../../components/librarian/Button";
import { RecommendationTable } from "../../components/RecommendationTable";

export function HodSubmitRecommendationPage({ user, items }) {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    publisher: "",
    edition: "",
    additionalNotes: ""
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.author.trim()) {
      alert("Please fill in at least Title and Author");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setFormData({
        title: "",
        author: "",
        isbn: "",
        publisher: "",
        edition: "",
        additionalNotes: ""
      });
      setSubmitted(true);
      setSubmitting(false);

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    }, 500);
  };

  const departmentItems = items ? items.filter(item => item.department === (user?.department || "DCEE")) : [];

  return (
    <div className="submit-request-page">
      <div className="page-header">
        <div>
          <h1>Submit Book Recommendation</h1>
          <p>Recommend books for {user?.department || "your department"}</p>
        </div>
      </div>

      {submitted && (
        <div style={{
          backgroundColor: "#e8f5e9",
          color: "#2e7d32",
          padding: "1rem",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          border: "1px solid #c8e6c9"
        }}>
          ✅ Recommendation submitted successfully!
        </div>
      )}

      <Card title="Add New Recommendation" className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-row">
              <div className="form-field">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Book title"
                  required
                />
              </div>
              <div className="form-field">
                <label>Author *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Author name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>ISBN</label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="ISBN"
                />
              </div>
              <div className="form-field">
                <label>Publisher</label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Publisher"
                />
              </div>
              <div className="form-field">
                <label>Edition</label>
                <input
                  type="text"
                  name="edition"
                  value={formData.edition}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Edition"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Additional Notes</label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Why this book is needed for the department..."
                rows="4"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
            >
              <Plus size={18} /> {submitting ? "Submitting..." : "Submit Recommendation"}
            </Button>
          </div>
        </form>
      </Card>

      {departmentItems.length > 0 && (
        <Card title={`Your Department Recommendations (${departmentItems.length})`} className="full-width" style={{ marginTop: "2rem" }}>
          <RecommendationTable
            items={departmentItems}
            compact
          />
        </Card>
      )}
    </div>
  );
}

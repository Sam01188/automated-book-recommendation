import { useState, useEffect } from "react";
import { Send, Eye } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { Button } from "../../components/librarian/Button";

function buildPeriodMessage(period) {
  if (!period) {
    return "";
  }

  const startDate = new Date(period.startDate).toLocaleDateString();
  const endDate = new Date(period.endDate).toLocaleDateString();

  return `Order Period for ${period.faculty}\n\nStart Date: ${startDate}\nEnd Date: ${endDate}\n\nPlease note: The order period for ${period.faculty} is now open. We kindly request all faculty members and departments to submit their book recommendations within this period.\n\nThank you.`;
}

export function EmailAnnouncementsPage({ selectedPeriod }) {
  const [formData, setFormData] = useState({
    period: selectedPeriod ? selectedPeriod.id.toString() : "1",
    recipients: "all",
    subject: selectedPeriod ? `Book Order Period - ${selectedPeriod.faculty}` : "",
    message: buildPeriodMessage(selectedPeriod)
  });

  const [previewMode, setPreviewMode] = useState(false);

  const periods = selectedPeriod
    ? [{ id: selectedPeriod.id.toString(), name: selectedPeriod.faculty, details: selectedPeriod }]
    : [
        { id: "1", name: "Jan - Mar 2026" },
        { id: "2", name: "Oct - Dec 2025" }
      ];

  useEffect(() => {
    if (selectedPeriod) {
      setFormData({
        period: selectedPeriod.id.toString(),
        recipients: "all",
        subject: `Book Order Period - ${selectedPeriod.faculty}`,
        message: buildPeriodMessage(selectedPeriod)
      });
    }
  }, [selectedPeriod]);

  const handleSendEmail = () => {
    console.log("Email sent:", formData);
    alert("Email sent successfully!");
  };

  return (
    <div className="dashboard-container">
      <div className="announcements-grid">
        <section className="large-panel">
          <h3 className="panel-title">Compose Email</h3>
          <Card className="form-card">
            <div className="form-group">
            <div className="form-field">
              <label>Order Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="form-input"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Recipients</label>
              <select
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                className="form-input"
              >
                <option value="all">All Lecturers</option>
                <option value="department">By Department</option>
                <option value="specific">Specific Users</option>
              </select>
            </div>

            <div className="form-field">
              <label>Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject"
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label>Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your message here..."
                className="form-textarea"
                rows="8"
              />
            </div>

            <div className="form-actions">
              <Button variant="secondary" onClick={() => setPreviewMode(!previewMode)}>
                <Eye size={18} /> {previewMode ? "Hide" : "Preview"}
              </Button>
              <Button variant="primary" onClick={handleSendEmail}>
                <Send size={18} /> Send Email
              </Button>
            </div>
            </div>
          </Card>
        </section>

        {previewMode && (
          <section className="large-panel">
            <h3 className="panel-title">Email Preview</h3>
            <Card className="preview-card">
              <div className="email-preview">
              <div className="preview-field">
                <strong>From:</strong> University of Ruhuna Engineering Library
              </div>
              <div className="preview-field">
                <strong>To:</strong> {formData.recipients === "all" ? "All Lecturers" : "Selected Recipients"}
              </div>
              <div className="preview-field">
                <strong>Subject:</strong> {formData.subject || "(No subject)"}
              </div>
              <div className="preview-body">
                <strong>Message:</strong>
                <div className="preview-message">
                  {formData.message || "(No message)"}
                </div>
              </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}

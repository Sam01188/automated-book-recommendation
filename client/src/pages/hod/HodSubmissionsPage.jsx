import { useState } from "react";
import { CheckCircle, Send } from "lucide-react";
import { Card } from "../../components/librarian/Card";

export function HodSubmissionsPage({ items, onSubmit, isPeriodOpen }) {
  const [submitting, setSubmitting] = useState(false);

  // Items already sent to the librarian (submitted state)
  const submittedItems = items.filter((item) => item.submittedToLibrarianAt);
  const isAlreadySubmitted = submittedItems.length > 0;

  // Active items in the current order (what would be / was submitted)
  // If already submitted, show the submitted set; otherwise show the ranked active set
  const orderedItems = isAlreadySubmitted
    ? submittedItems.sort((a, b) => (a.priorityRank || 9999) - (b.priorityRank || 9999))
    : items
      .filter(
        (item) =>
          item.status !== "rejected" &&
          (item.status !== "submitted" || !item.reviewedBy)
      )
      .sort((a, b) => {
        const aRank = Number.isFinite(a.priorityRank) ? a.priorityRank : Number.MAX_SAFE_INTEGER;
        const bRank = Number.isFinite(b.priorityRank) ? b.priorityRank : Number.MAX_SAFE_INTEGER;
        if (aRank !== bRank) return aRank - bRank;
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });

  const allRanked =
    orderedItems.length > 0 &&
    orderedItems.every((item) => Number.isFinite(item.priorityRank));

  const handleSubmit = async () => {
    if (!allRanked) {
      alert("Please rank all recommendations on the Assign Priority page before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit?.();
    } catch (error) {
      alert(error.message || "Failed to submit recommendations");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="large-panel">
      {/* ── Period closed banner ─────────────────────────────────────────── */}
      {!isPeriodOpen && !isAlreadySubmitted && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)",
            color: "var(--danger)",
            borderRadius: "var(--radius)",
            padding: "1rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(239, 68, 68, 0.35)",
          }}
        >
          ⚠️ HOD Priority Assignment Period is closed. Submitting to the
          librarian is disabled.
        </div>
      )}

      {/* ── Already submitted banner ─────────────────────────────────────── */}
      {isAlreadySubmitted && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)",
            color: "var(--success)",
            borderRadius: "var(--radius)",
            padding: "1rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <CheckCircle size={20} />
          ✅ Your recommendations have been submitted to the librarian
        </div>
      )}

      {/* ── Ordered list table ───────────────────────────────────────────── */}
      <h2 className="panel-title" style={{ marginBottom: "0.75rem" }}>
        {isAlreadySubmitted
          ? "Submitted Recommendation Order"
          : "Current Recommendation Order"}
      </h2>
      <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>
        {isAlreadySubmitted
          ? "The following list was submitted to the librarian in this priority order."
          : "This is the current order that will be sent to the librarian. Adjust the order on the Assign Priority page."}
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Title</th>
              <th>Author</th>
              <th>Publisher</th>
              <th>Submitted By</th>
            </tr>
          </thead>
          <tbody>
            {orderedItems.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  No recommendations in the current order. Go to Assign Priority
                  to build the list.
                </td>
              </tr>
            ) : (
              orderedItems.map((item, index) => (
                <tr key={item._id}>
                  <td style={{ fontWeight: 700 }}>
                    {Number.isFinite(item.priorityRank)
                      ? item.priorityRank
                      : index + 1}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.title}</td>
                  <td>{item.author}</td>
                  <td>{item.publisher}</td>
                  <td>{item.submittedBy?.name || "Lecturer"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isPeriodOpen && !isAlreadySubmitted && (
        <Card style={{ marginTop: "1.5rem", padding: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {orderedItems.length === 0
                ? "No recommendations to submit."
                : allRanked
                  ? "✅ All recommendations ranked — ready to submit to the librarian"
                  : "⚠️ Some recommendations are not yet ranked. Go to Assign Priority to fix the order."}
            </p>
            <button
              className="primary-button"
              onClick={handleSubmit}
              disabled={!allRanked || orderedItems.length === 0 || submitting}
              style={{
                opacity:
                  allRanked && orderedItems.length > 0 && !submitting ? 1 : 0.6,
                cursor:
                  allRanked && orderedItems.length > 0 && !submitting
                    ? "pointer"
                    : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
              }}
            >
              <Send size={16} />
              {submitting ? "Submitting…" : "Submit to Librarian"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

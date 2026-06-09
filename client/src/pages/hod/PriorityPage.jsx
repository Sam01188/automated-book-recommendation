import { CheckCircle, Send } from "lucide-react";
import { HodRankTable } from "../../components/HodRankTable";
import { Card } from "../../components/librarian/Card";

export function PriorityPage({ items, onOrderChange, isPeriodOpen, currentPeriod, onSubmit }) {
  const activeItems = items.filter(
    (item) => item.status !== "rejected" && (item.status !== "submitted" || !item.reviewedBy)
  );

  const allRanked = activeItems.length > 0 && activeItems.every((item) => Number.isFinite(item.priorityRank));
  const submittedItems = items.filter((item) => item.submittedToLibrarianAt);
  const isAlreadySubmitted = submittedItems.length > 0;

  const handleSubmit = async () => {
    if (!allRanked) {
      alert("Please rank all recommendations before submitting.");
      return;
    }
    try {
      await onSubmit?.();
    } catch (error) {
      alert(error.message || "Failed to submit recommendations");
    }
  };

  return (
    <div className="large-panel">
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
          ⚠️ HOD Priority Assignment Period is closed. You can view pending requests but cannot assign or change priorities at this time.
        </div>
      )}

      {isAlreadySubmitted && (
        <div style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)",
          color: "var(--success)",
          borderRadius: "var(--radius)",
          padding: "1rem 1.25rem",
          fontWeight: 600,
          fontSize: "0.95rem",
          marginBottom: "1.5rem",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <CheckCircle size={20} />
          ✅ Your recommendations have been submitted to the librarian
        </div>
      )}

      <div className="guidelines priority-guidelines">
        <strong>Priority Assignment Guidelines</strong>
        <ul className="guideline-list">
          <li className="guideline-item">
            <span className="guideline-term high">1</span>
            Most important recommendation for the department
          </li>
          <li className="guideline-item">
            <span className="guideline-term medium">2, 3, 4...</span>
            Continue in descending order by dragging rows or using the arrow buttons
          </li>
        </ul>
      </div>
      {activeItems.length === 0 ? (
        <p>No pending recommendations available for priority assignment.</p>
      ) : (
        <>
          <HodRankTable
            items={activeItems}
            title="Department Recommendation Order"
            onOrderChange={onOrderChange}
            disabled={!isPeriodOpen || isAlreadySubmitted}
          />
          {isPeriodOpen && !isAlreadySubmitted && (
            <Card style={{ marginTop: "1.5rem", padding: "1rem" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem"
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    {allRanked ? "✅ All recommendations ranked" : "⚠️ Not all recommendations are ranked"}
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={handleSubmit}
                  disabled={!allRanked}
                  style={{
                    opacity: allRanked ? 1 : 0.6,
                    cursor: allRanked ? "pointer" : "not-allowed"
                  }}
                >
                  <Send size={16} style={{ marginRight: "0.5rem" }} />
                  Submit to Librarian
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

import { RecommendationTable } from "../../components/RecommendationTable";

function getPrioritySortValue(item) {
  const rank = Number(item.priority);
  if (Number.isFinite(rank)) return rank;
  return Number.MAX_SAFE_INTEGER;
}

export function PriorityPage({ items, onPriority }) {
  const activeItems = items.filter((item) => item.status !== "submitted" || !item.reviewedBy);
  const sortedItems = activeItems.slice().sort((a, b) => getPrioritySortValue(a) - getPrioritySortValue(b));

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
            Assign rank 1 to the most urgent recommendation
          </li>
          <li className="guideline-item">
            <span className="guideline-term medium">2</span>
            Assign rank 2 to the next most important recommendation
          </li>
          <li className="guideline-item">
            <span className="guideline-term low">3+</span>
            Use higher numbers for lower priority recommendations
          </li>
        </ul>
      </div>
      {sortedItems.length === 0 ? (
        <p>No pending recommendations available for priority assignment.</p>
      ) : (
        <RecommendationTable items={sortedItems} compact onPriority={onPriority} title="Priority Ranking" />
      )}
    </div>
  );
}

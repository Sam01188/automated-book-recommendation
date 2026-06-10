import { HodRankTable } from "../../components/HodRankTable";

export function AllRecommendationsPage({ items, filterPriority = "all", onOrderChange, onSubmit, isPeriodOpen, currentPeriod }) {
  const activeItems = items.filter(
    (item) => item.status !== "rejected" && (item.status !== "submitted" || !item.reviewedBy)
  );
  const filteredItems =
    filterPriority === "all"
      ? activeItems
      : filterPriority === "prioritized"
      ? activeItems.filter((item) => item.priority !== "unassigned")
      : activeItems.filter((item) => item.priority === filterPriority);
  const title =
    filterPriority === "prioritized"
      ? "Prioritized Recommendations"
      : filterPriority === "high"
      ? "High Priority Recommendations"
      : "All Recommendations";
  const allAssigned = activeItems.length > 0 && activeItems.every((item) => item.priority !== "unassigned");

  return (
    <>
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
          ⚠️ HOD Priority Assignment Period is closed. Submitting to the librarian or assigning priorities is disabled.
        </div>
      )}

      {onSubmit && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <button
            className="primary-button"
            disabled={!allAssigned || !isPeriodOpen}
            onClick={onSubmit}
            style={{ minWidth: "220px", opacity: (!allAssigned || !isPeriodOpen) ? 0.6 : 1 }}
          >
            Submit to Librarian
          </button>
        </div>
      )}
      <HodRankTable
        items={filteredItems} 
        title={title} 
        onOrderChange={onOrderChange}
        disabled={!isPeriodOpen}
      />
    </>
  );
}

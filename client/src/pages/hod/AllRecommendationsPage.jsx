import { RecommendationTable } from "../../components/RecommendationTable";

export function AllRecommendationsPage({ items, filterPriority = "all", onPriority, onSubmit }) {
  const activeItems = items.filter(
    (item) => item.status !== "submitted" || !item.reviewedBy
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
      {onSubmit && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <button
            className="primary-button"
            disabled={!allAssigned}
            onClick={onSubmit}
            style={{ minWidth: "220px" }}
          >
            Submit to Librarian
          </button>
          {!allAssigned && (
            <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Assign a priority to every recommendation before submitting.
            </span>
          )}
        </div>
      )}
      <RecommendationTable items={filteredItems} title={title} compact onPriority={onPriority} />
    </>
  );
}

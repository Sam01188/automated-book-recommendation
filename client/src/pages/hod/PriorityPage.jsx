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

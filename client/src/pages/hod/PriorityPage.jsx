import { RecommendationTable } from "../../components/RecommendationTable";

export function PriorityPage({ items, onPriority }) {
  const activeItems = items.filter((item) => item.status !== "submitted" || !item.reviewedBy);
  const itemsByLecturer = activeItems.reduce((groups, item) => {
    const lecturer = item.submittedBy?.name || "Unknown Lecturer";
    if (!groups[lecturer]) groups[lecturer] = [];
    groups[lecturer].push(item);
    return groups;
  }, {});

  return (
    <div className="large-panel">
      <div className="guidelines priority-guidelines">
        <strong>Priority Assignment Guidelines</strong>
        <ul className="guideline-list">
          <li className="guideline-item">
            <span className="guideline-term high">High</span>
            Essential for upcoming courses or research
          </li>
          <li className="guideline-item">
            <span className="guideline-term medium">Medium</span>
            Beneficial but not immediately critical
          </li>
          <li className="guideline-item">
            <span className="guideline-term low">Low</span>
            Nice to have for reference collection
          </li>
        </ul>
      </div>
      {Object.keys(itemsByLecturer).length === 0 ? (
        <p>No pending recommendations available for priority assignment.</p>
      ) : (
        Object.entries(itemsByLecturer).map(([lecturer, lecturerItems]) => (
          <div key={lecturer} style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "0.75rem" }}>{lecturer}</h3>
            <RecommendationTable items={lecturerItems} compact onPriority={onPriority} title="" />
          </div>
        ))
      )}
    </div>
  );
}

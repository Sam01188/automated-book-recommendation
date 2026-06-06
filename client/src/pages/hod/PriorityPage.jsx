import { RecommendationTable } from "../../components/RecommendationTable";

export function PriorityPage({ items, onPriority }) {
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
      <RecommendationTable items={items} compact onPriority={onPriority} title="Assign Priority" />
    </div>
  );
}

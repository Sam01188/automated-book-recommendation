import { RecommendationTable } from "../../components/RecommendationTable";

export function PriorityPage({ items, onPriority }) {
  return (
    <div className="large-panel">
      <div className="guidelines">
        <strong>Priority Assignment Guidelines</strong>
        <span>High: Essential for upcoming courses or research</span>
        <span>Medium: Beneficial but not immediately critical</span>
        <span>Low: Nice to have for reference collection</span>
      </div>
      <RecommendationTable items={items} compact onPriority={onPriority} title="Assign Priority" />
    </div>
  );
}

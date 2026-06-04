import { RecommendationTable } from "../../components/RecommendationTable";

export function AllRecommendationsPage({ items, filterPriority = "all" }) {
  const filteredItems = filterPriority === "all" ? items : items.filter((item) => item.priority === filterPriority);
  const title = filterPriority === "high" ? "High Priority Recommendations" : "All Recommendations";

  return <RecommendationTable items={filteredItems} title={title} />;
}

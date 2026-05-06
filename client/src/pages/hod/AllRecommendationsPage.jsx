import { RecommendationTable } from "../../components/RecommendationTable";

export function AllRecommendationsPage({ items }) {
  return <RecommendationTable items={items} title="All Recommendations" />;
}

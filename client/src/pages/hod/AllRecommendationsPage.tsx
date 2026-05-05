import { RecommendationTable } from "../../components/RecommendationTable";
import type { Recommendation } from "../../types";

export function AllRecommendationsPage({ items }: { items: Recommendation[] }) {
  return <RecommendationTable items={items} title="All Recommendations" />;
}

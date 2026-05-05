import { CompactList } from "../../components/RecommendationList";
import type { Recommendation } from "../../types";

export function MyRecommendationsPage({ items }: { items: Recommendation[] }) {
  return (
    <div className="large-panel">
      <h2>My Book Recommendations</h2>
      {items.length ? <CompactList items={items} /> : <div className="empty-box">No book recommendations found.</div>}
    </div>
  );
}

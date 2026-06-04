import { CompactList } from "../../components/RecommendationList";

export function MyRecommendationsPage({ items }) {
  return (
    <div className="large-panel">
      <h2>My Book Recommendations</h2>
      {items.length ? <CompactList items={items} /> : <div className="empty-box">No book recommendations found.</div>}
    </div>
  );
}

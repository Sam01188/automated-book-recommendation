import { RecommendationTable } from "../../components/RecommendationTable";

export function HodSubmissionsPage({ items, currentUserId }) {
  const filteredItems = items.filter((item) => {
    const reviewedById = item.reviewedBy?._id || item.reviewedBy;
    return item.status === "submitted" && reviewedById === currentUserId;
  });

  return <RecommendationTable items={filteredItems} title="Submitted to Librarian" />;
}

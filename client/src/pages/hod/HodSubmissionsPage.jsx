import { RecommendationTable } from "../../components/RecommendationTable";

export function HodSubmissionsPage({ items = [], currentUserId }) {
  const filteredItems = items
    .filter((item) => {
      const reviewedById = item.reviewedBy?._id || item.reviewedBy;
      return item.status === "submitted" && String(reviewedById) === String(currentUserId);
    })
    .sort((a, b) => {
      const aRank = Number.isFinite(a.priorityRank) ? a.priorityRank : Number.MAX_SAFE_INTEGER;
      const bRank = Number.isFinite(b.priorityRank) ? b.priorityRank : Number.MAX_SAFE_INTEGER;
      return aRank - bRank || new Date(a.createdAt) - new Date(b.createdAt);
    });

  return <RecommendationTable items={filteredItems} title="Submitted to Librarian" />;
}

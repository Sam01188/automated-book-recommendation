import { RecommendationTable } from "../../components/RecommendationTable";

export function AllSubmissionsPage({ items }) {
  return <RecommendationTable items={items} title="All Submissions" />;
}

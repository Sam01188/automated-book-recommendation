import { DashboardContent } from "../../components/DashboardContent";
import type { Recommendation, Stats, User } from "../../types";

export function LecturerDashboardPage({ user, stats, items }: { user: User; stats: Stats; items: Recommendation[] }) {
  return <DashboardContent user={user} stats={stats} items={items} />;
}

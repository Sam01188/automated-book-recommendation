import { DashboardContent } from "../../components/DashboardContent";

export function LibrarianDashboardPage({ user, stats, items }) {
  return <DashboardContent user={user} stats={stats} items={items} />;
}

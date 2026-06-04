import { DashboardContent } from "../../components/DashboardContent";

export function LecturerDashboardPage({ user, stats, items }) {
  return <DashboardContent user={user} stats={stats} items={items} />;
}

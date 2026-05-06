import { DashboardContent } from "../../components/DashboardContent";

export function AdminDashboard({ user, stats, items }) {
  return <DashboardContent user={user} stats={stats} items={items} />;
}

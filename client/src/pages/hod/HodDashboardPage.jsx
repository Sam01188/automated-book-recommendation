import { DashboardContent } from "../../components/DashboardContent";

export function HodDashboardPage({ user, stats, items }) {
  return <DashboardContent user={user} stats={stats} items={items} />;
}

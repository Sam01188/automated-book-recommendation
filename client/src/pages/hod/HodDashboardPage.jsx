import { DashboardContent } from "../../components/DashboardContent";

export function HodDashboardPage({ user, stats, items, onHighPriorityClick }) {
  return (
    <DashboardContent
      user={user}
      stats={stats}
      items={items}
      onHighPriorityClick={onHighPriorityClick}
    />
  );
}

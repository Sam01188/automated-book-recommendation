import { DashboardContent } from "../../components/DashboardContent";

export function HodDashboardPage({ user, stats, items, onTotalClick, onPendingClick, onHighPriorityClick }) {
  return (
    <DashboardContent
      user={user}
      stats={stats}
      items={items}
      onTotalClick={onTotalClick}
      onPendingClick={onPendingClick}
      onHighPriorityClick={onHighPriorityClick}
    />
  );
}

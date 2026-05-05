import { BookMarked, ClipboardList, ShieldCheck } from "lucide-react";
import { Metric } from "./Metric";
import { CompactList } from "./RecommendationList";
import type { Recommendation, Stats, User } from "../types";

export function DashboardContent({ user, stats, items }: { user: User; stats: Stats; items: Recommendation[] }) {
  return (
    <section className="panel-space">
      <h2>Welcome, {user.name}!</h2>
      <div className="metrics">
        <Metric label="Total Submissions" value={stats.total} icon={<BookMarked size={18} />} />
        <Metric label="Pending Review" value={stats.pending} icon={<ClipboardList size={18} />} />
        <Metric
          label={user.role === "lecturer" ? "Approved" : "High Priority"}
          value={user.role === "lecturer" ? stats.approved : stats.highPriority}
          icon={<ShieldCheck size={18} />}
        />
      </div>
      <div className="large-panel">
        <h3>{user.role === "lecturer" ? "Recent Submissions" : user.role === "hod" ? "Pending Recommendations" : "All Submissions"}</h3>
        {items.length === 0 ? (
          <div className="empty-state">
            <BookMarked size={42} />
            <span>No submissions yet</span>
          </div>
        ) : (
          <CompactList items={items.slice(0, 5)} />
        )}
      </div>
    </section>
  );
}

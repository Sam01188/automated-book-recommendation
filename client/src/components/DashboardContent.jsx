import { BookMarked, ClipboardList, ShieldX } from "lucide-react";
import { Metric } from "./Metric";
import { CompactList } from "./RecommendationList";

export function DashboardContent({ user, stats, items }) {
  return (
    <section className="panel-space">
      <div className="metrics">
        <Metric 
          label="Total Submissions" 
          value={stats.total} 
          icon={<BookMarked size={20} />} 
        />
        <Metric 
          label="Pending Review" 
          value={stats.pending} 
          icon={<ClipboardList size={20} />} 
        />
        <Metric
          label={user.role === "lecturer" ? "Rejected" : "Ranked Items"}
          value={user.role === "lecturer" ? stats.rejected : stats.highPriority}
          icon={<ShieldX size={20} />}
        />
      </div>

      <div className="large-panel">
        <h3 className="panel-title">
          {user.role === "lecturer" ? "Recent Submissions" : user.role === "hod" ? "Pending Recommendations" : "All Submissions"}
        </h3>
        {items.length === 0 ? (
          <div className="empty-state">
            <BookMarked size={48} color="var(--border)" />
            <p>No records found in this view.</p>
          </div>
        ) : (
          <CompactList items={items.slice(0, 5)} />
        )}
      </div>
    </section>
  );
}

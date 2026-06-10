import { ClipboardList, Hourglass, Zap } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { DataTable } from "../../components/librarian/DataTable";
import { Badge } from "../../components/librarian/Badge";
import { getPriorityBadgeType, getStatusBadgeType } from "./recommendationBadges";

function formatSubmittedDate(item) {
  const dateValue = item.submittedAt || item.createdAt || item.updatedAt;

  if (!dateValue) {
    return "N/A";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString('en-GB');
}

function LibrarianMetricCard({ icon: Icon, label, value }) {
  return (
    <article className="metric-card admin-stat-card">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">
          <Icon size={20} />
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
    </article>
  );
}

export function LibrarianDashboardPage({ user, stats, items }) {
  const recentItems = items.slice(0, 5);

  return (
    <div className="dashboard-container">
      {/* Metric Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.5rem"
      }}>
        <LibrarianMetricCard
          icon={ClipboardList}
          label="Total Submissions"
          value={stats.total ?? 0}
        />
        <LibrarianMetricCard
          icon={Hourglass}
          label="Pending Review"
          value={stats.pending ?? 0}
        />
        <LibrarianMetricCard
          icon={Zap}
          label="HoD Submissions"
          value={stats.highPriority ?? 0}
        />
      </div>

      {/* Recent Submissions Panel */}
      <div className="large-panel">
        <h2 className="panel-title">Recent Submissions</h2>

        {recentItems.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "var(--text-muted)",
            fontSize: "0.9375rem",
            fontWeight: 500,
            letterSpacing: "0.04em",
            textTransform: "uppercase"
          }}>
            No Submissions Yet
          </div>
        ) : (
          <Card className="full-width">
            <DataTable
              className="recent-submissions-table"
              columns={[
                { key: "title", label: "Title", width: "25%" },
                { key: "author", label: "Author", width: "15%" },
                { key: "rank", label: "Rank", width: "15%" },
                { key: "status", label: "Status", width: "15%" },
                { key: "department", label: "Department", width: "15%" },
                { key: "submitted", label: "Submitted", width: "15%" }
              ]}
              data={recentItems}
              renderRow={(item) => (
                <>
                  <td>
                    <strong className="recent-submission-title">{item.title}</strong>
                  </td>
                  <td>{item.author}</td>
                  <td>
                    <span style={{
                      padding: "0.2rem 0.65rem",
                      borderRadius: "2rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      background: item.priorityRank ? "rgba(var(--primary-rgb), 0.15)" : "var(--surface-hover)",
                      color: item.priorityRank ? "var(--primary)" : "var(--text-muted)",
                      border: `1px solid ${item.priorityRank ? "rgba(var(--primary-rgb), 0.3)" : "var(--border)"}`
                    }}>
                      {item.priorityRank ? `Rank ${item.priorityRank}` : "unassigned"}
                    </span>
                  </td>
                  <td>
                    <Badge label={item.status} type={getStatusBadgeType(item.status)} />
                  </td>
                  <td>{item.department}</td>
                  <td className="text-muted">{formatSubmittedDate(item)}</td>
                </>
              )}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

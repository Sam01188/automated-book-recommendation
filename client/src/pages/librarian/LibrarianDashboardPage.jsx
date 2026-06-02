import { Building2, ClipboardList, Hourglass, TriangleAlert } from "lucide-react";
import { StatCard } from "../../components/librarian/StatCard";
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

  return date.toLocaleDateString();
}

export function LibrarianDashboardPage({ stats, items }) {
  const recentItems = items.slice(0, 5);

  return (
    <div className="dashboard-container">
      <section className="metrics admin-metrics" aria-label="Library statistics">
        <StatCard
          title="Total Submissions"
          value={stats.total}
          icon={ClipboardList}
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={Hourglass}
        />
        <StatCard
          title="High Priority"
          value={stats.highPriority}
          icon={TriangleAlert}
        />
        <StatCard
          title="Departments"
          value="5"
          icon={Building2}
        />
      </section>

      <section className="large-panel recent-submissions-panel">
        <h3 className="panel-title">Recent Submissions</h3>
        <Card className="full-width">
          <DataTable
            className="recent-submissions-table"
            columns={[
              { key: "title", label: "Title", width: "25%" },
              { key: "author", label: "Author", width: "15%" },
              { key: "priority", label: "Priority", width: "15%" },
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
                  <Badge label={item.priority || "Unassigned"} type={getPriorityBadgeType(item.priority)} />
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
      </section>
    </div>
  );
}

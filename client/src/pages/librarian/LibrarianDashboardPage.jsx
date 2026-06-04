import { BarChart3, Clock, DollarSign, Zap } from "lucide-react";
import { StatCard } from "../../components/librarian/StatCard";
import { Card } from "../../components/librarian/Card";
import { DataTable } from "../../components/librarian/DataTable";
import { Badge } from "../../components/librarian/Badge";

export function LibrarianDashboardPage({ user, stats, items, onHighPriorityClick }) {
  const recentItems = items.slice(0, 5);

  const getStatusBadgeType = (status) => {
    const statusMap = {
      "pending": "warning",
      "approved": "success",
      "rejected": "danger",
      "under_review": "info"
    };
    return statusMap[status] || "default";
  };

  const getPriorityBadgeType = (priority) => {
    const priorityMap = {
      "high": "danger",
      "medium": "warning",
      "low": "success",
      "unassigned": "secondary"
    };
    return priorityMap[priority] || "default";
  };

  return (
    <div className="librarian-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user.name}</h1>
          <p>Here's what's happening with your library today</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Submissions"
          value={stats.total}
          icon={<BarChart3 size={24} />}
        />
        <StatCard
          label="Pending Review"
          value={stats.pending}
          icon={<Clock size={24} />}
        />
        <StatCard
          label="High Priority"
          value={stats.highPriority}
          icon={<Zap size={24} />}
          onClick={onHighPriorityClick}
        />
        <StatCard
          label="Departments"
          value="5"
          icon={<DollarSign size={24} />}
        />
      </div>

      <div className="dashboard-content">
        <Card title="Recent Submissions" className="full-width">
          <DataTable
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
                  <strong>{item.title}</strong>
                </td>
                <td>{item.author}</td>
                <td>
                  <Badge label={item.priority || "Unassigned"} type={getPriorityBadgeType(item.priority)} />
                </td>
                <td>
                  <Badge label={item.status} type={getStatusBadgeType(item.status)} />
                </td>
                <td>{item.department}</td>
                <td className="text-muted">Today</td>
              </>
            )}
          />
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { GraduationCap, UserCheck, UserCog, Users } from "lucide-react";
import { fetchRecommendations, getUsers } from "../../api";

function StatCard({ title, value, icon: Icon }) {
  return (
    <article className="metric-card admin-stat-card">
      <div className="metric-header">
        <span className="metric-label">{title}</span>
        <span className="metric-icon">
          <Icon size={20} />
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
    </article>
  );
}

function formatActivityDateTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  return new Date(dateValue).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getRecentActivities(users, recommendations, adminUser) {
  const adminName = adminUser?.name || "Admin";

  const userActivities = users.map((item) => {
    const createdAt = item.createdAt;
    const updatedAt = item.updatedAt;
    const wasUpdated = createdAt && updatedAt && new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;

    return {
      id: `user-${item._id}`,
      text: wasUpdated ? `${item.name} account updated` : `${item.name} account created`,
      time: updatedAt || createdAt,
      label: `by ${adminName}`
    };
  });

  const recommendationActivities = recommendations.map((item) => {
    const priorityUpdated = item.priority && item.priority !== "unassigned";
    const submittedBy = item.submittedBy?.name || "Lecturer";
    const reviewedBy = item.reviewedBy?.name || "HoD";
    const department = item.department || "N/A";

    return {
      id: `recommendation-${item._id}`,
      text: priorityUpdated ? `Priority updated for ${item.title}` : `Recommendation submitted: ${item.title}`,
      time: item.updatedAt || item.createdAt,
      label: priorityUpdated ? `by ${reviewedBy} ${department}` : `by ${submittedBy} ${department}`
    };
  });

  return [...userActivities, ...recommendationActivities]
    .filter((item) => item.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5);
}

export function AdminDashboard({ user, token, items = [] }) {
  const [userCounts, setUserCounts] = useState({
    total: 0,
    lecturer: 0,
    hod: 0,
    librarian: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function refreshOverview() {
      try {
        const [users, recommendations] = await Promise.all([
          getUsers(token),
          fetchRecommendations(token, "admin")
        ]);

        setUserCounts({
          total: users.length,
          lecturer: users.filter((item) => item.role === "lecturer").length,
          hod: users.filter((item) => item.role === "hod").length,
          librarian: users.filter((item) => item.role === "librarian").length
        });

        setRecentActivities(getRecentActivities(users, recommendations, user));
      } catch (err) {
        setUserCounts({ total: 0, lecturer: 0, hod: 0, librarian: 0 });
        setRecentActivities(getRecentActivities([], items, user));
      }
    }

    refreshOverview();
    const intervalId = window.setInterval(refreshOverview, 10000);
    return () => window.clearInterval(intervalId);
  }, [token, items, user]);

  if (!user || user.role !== "admin") {
    return null;
  }
  
  return (
    <div className="dashboard-container">
      <section className="metrics admin-metrics" aria-label="System statistics">
        <StatCard title="Total Users" value={userCounts.total} icon={Users} />
        <StatCard title="Total Lecturers" value={userCounts.lecturer} icon={GraduationCap} />
        <StatCard title="Total HoDs" value={userCounts.hod} icon={UserCheck} />
        <StatCard title="Total Librarians" value={userCounts.librarian} icon={UserCog} />
      </section>

      <section className="large-panel admin-activity-panel">
        <h2 className="panel-title">Recent Activity</h2>
        <ul className="admin-activity-list">
          {recentActivities.length === 0 && (
            <li>
              <span className="activity-dot" />
              <span>No recent activity yet</span>
            </li>
          )}

          {recentActivities.map((activity) => (
            <li key={activity.id}>
                <span className="activity-dot" />
                <span>
                  <strong>{activity.text}</strong>
                  <small>
                    <span>{activity.label}</span>
                    {formatActivityDateTime(activity.time) && <time>{formatActivityDateTime(activity.time)}</time>}
                  </small>
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

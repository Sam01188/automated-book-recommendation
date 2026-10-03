import { useEffect, useState } from "react";
import { GraduationCap, UserCheck, UserCog, Users } from "lucide-react";
import { getAuditLogs, getUsers } from "../../api";

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

function getRecentActivities(auditLogs) {
  return auditLogs
    .filter((log) => log.actorRole === "admin" || !log.actorRole)
    .map((log) => {
    const actionLabels = {
      user_created: "account created",
      user_updated: "account updated",
      user_activated: "account activated",
      user_deactivated: "account deactivated",
      user_deleted: "account deleted",
      user_login: "signed in",
      user_logout: "signed out",
      password_changed: "changed password",
      password_reset_requested: "requested a password reset",
      password_reset: "reset password",
      profile_updated: "updated profile",
      recommendation_created: "recommendation submitted",
      recommendation_updated: "recommendation updated",
      recommendation_deleted: "recommendation deleted",
      recommendation_priority_assigned: "recommendation prioritized",
      recommendation_rejected: "recommendation rejected",
      recommendation_status_updated: "recommendation status changed",
      order_period_created: "order period created",
      order_period_updated: "order period updated",
      order_period_closed: "order period closed",
      order_period_hod_opened: "HoD review opened",
      order_period_deleted: "order period deleted"
    };
    const changes = log.changes?.length ? ` (${log.changes.join(", ")})` : "";

    return {
      id: log._id,
      text: `${log.targetName || "Activity"} ${actionLabels[log.action] || log.action}${log.action === "user_updated" ? changes : ""}`,
      time: log.createdAt,
      label: `by ${log.actorName || "Admin"}`
    };
  });
}

export function AdminDashboard({ user, token }) {
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
        const [users, auditResponse] = await Promise.all([
          getUsers(token),
          getAuditLogs(token, { page: 1, limit: 5, role: "admin" })
        ]);

        setUserCounts({
          total: users.length,
          lecturer: users.filter((item) => item.role === "lecturer").length,
          hod: users.filter((item) => item.role === "hod").length,
          librarian: users.filter((item) => item.role === "librarian").length
        });

        setRecentActivities(getRecentActivities(auditResponse.logs || []));
      } catch (err) {
        setUserCounts({ total: 0, lecturer: 0, hod: 0, librarian: 0 });
        setRecentActivities([]);
      }
    }

    refreshOverview();
    const intervalId = window.setInterval(refreshOverview, 10000);
    return () => window.clearInterval(intervalId);
  }, [token, user]);

  if (!user || user.role !== "admin") {
    return null;
  }
  
  return (
    <div className="dashboard-container">
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.5rem"
      }} aria-label="System statistics">
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

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, RotateCcw } from "lucide-react";
import { getAuditLogs } from "../../api";

const actionLabels = {
  user_created: "User created",
  user_updated: "User updated",
  user_activated: "Account activated",
  user_deactivated: "Account deactivated",
  user_deleted: "User deleted",
  user_login: "Signed in",
  user_logout: "Signed out",
  password_changed: "Password changed",
  password_reset_requested: "Password reset requested",
  password_reset: "Password reset completed",
  profile_updated: "Profile updated",
  recommendation_created: "Recommendation submitted",
  recommendation_updated: "Recommendation updated",
  recommendation_deleted: "Recommendation deleted",
  recommendation_priority_assigned: "Recommendation prioritized",
  recommendation_rejected: "Recommendation rejected",
  recommendations_ranked: "Recommendations ranked",
  recommendation_order_reset: "Recommendation ranking reset",
  recommendations_submitted: "Recommendations sent to librarian",
  recommendation_status_updated: "Recommendation status changed",
  order_period_created: "Order period created",
  order_period_updated: "Order period updated",
  order_period_closed: "Order period closed",
  order_period_hod_opened: "HoD review opened",
  order_period_deleted: "Order period deleted"
};

function formatRole(role) {
  if (!role) return "Unknown";
  if (role === "system") return "System";
  if (role === "hod") return "HoD";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeCsvCell(value) {
  let text = String(value ?? "");
  if (/^[\t\r ]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function AuditLogPage({ token }) {
  const [filters, setFilters] = useState({ startDate: "", endDate: "", role: "", action: "" });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ logs: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const invalidDateRange = Boolean(filters.startDate && filters.endDate && filters.endDate < filters.startDate);

  useEffect(() => {
    let active = true;
    if (invalidDateRange) {
      setResult({ logs: [], total: 0, pages: 0 });
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);

    getAuditLogs(token, { ...filters, page, limit: 50 })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch(() => {
        if (active) setResult({ logs: [], total: 0, pages: 0 });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, filters, page, invalidDateRange]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters({ startDate: "", endDate: "", role: "", action: "" });
    setPage(1);
  }

  async function exportAuditHistory() {
    if (invalidDateRange) return;
    setExporting(true);
    try {
      const firstPage = await getAuditLogs(token, { ...filters, page: 1, limit: 100 });
      const logs = [...firstPage.logs];
      for (let nextPage = 2; nextPage <= firstPage.pages; nextPage += 1) {
        const pageData = await getAuditLogs(token, { ...filters, page: nextPage, limit: 100 });
        logs.push(...pageData.logs);
      }

      const rows = [
        ["Date", "Time", "Actor", "Email", "Role", "Activity"],
        ...logs.map((log) => {
          const legacyAdminActions = ["user_created", "user_updated", "user_activated", "user_deactivated", "user_deleted"];
          const role = log.actorRole || (legacyAdminActions.includes(log.action) ? "admin" : "Unknown");
          return [
            log.createdAt ? new Date(log.createdAt).toISOString().slice(0, 10) : "",
            log.createdAt ? new Date(log.createdAt).toISOString().slice(11, 19) : "",
            log.actorName || "Unknown",
            log.actorEmail || "",
            formatRole(role),
            actionLabels[log.action] || log.action
          ];
        })
      ];
      const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-history-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Failed to export audit history:", error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="dashboard-container">
      <section className="large-panel">
        <div className="panel-toolbar">
          <div>
            <h2 className="panel-title">Audit History</h2>
            <p className="text-muted">{result.total} recorded activities</p>
          </div>
          <div className="audit-log-filters">
            <label className="audit-date-field">
              From
              <input
                type="date"
                value={filters.startDate}
                max={filters.endDate || undefined}
                onChange={(event) => updateFilter("startDate", event.target.value)}
                aria-label="Audit history start date"
              />
            </label>
            <label className="audit-date-field">
              To
              <input
                type="date"
                value={filters.endDate}
                min={filters.startDate || undefined}
                onChange={(event) => updateFilter("endDate", event.target.value)}
                aria-label="Audit history end date"
              />
            </label>
            <select value={filters.role} onChange={(event) => updateFilter("role", event.target.value)} aria-label="Filter by actor role">
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="librarian">Librarian</option>
              <option value="hod">HoD</option>
              <option value="lecturer">Lecturer</option>
              <option value="system">System</option>
            </select>
            <select value={filters.action} onChange={(event) => updateFilter("action", event.target.value)} aria-label="Filter by activity">
              <option value="">All activities</option>
              {Object.entries(actionLabels).filter(([action]) => action !== "password_reset_requested").map(([action, label]) => (
                <option key={action} value={action}>{action === "password_reset" ? "Password reset" : label}</option>
              ))}
            </select>
            <div className="audit-filter-actions">
              <button className="secondary-button audit-icon-button audit-filter-reset" type="button" onClick={resetFilters} aria-label="Reset filters" title="Reset filters">
                <RotateCcw size={16} stroke="var(--text)" aria-hidden="true" />
              </button>
              <button className="secondary-button audit-icon-button" type="button" onClick={exportAuditHistory} disabled={exporting || loading || invalidDateRange} aria-label="Export matching audit activity as CSV" title="Export matching audit activity as CSV">
                <Download size={16} stroke="var(--text)" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {invalidDateRange && <p role="alert" className="text-danger">The end date must be on or after the start date.</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {!loading && result.logs.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: "center" }}>No audit activity found.</td></tr>
              )}
              {result.logs.map((log) => (
                <tr key={log._id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>{formatTime(log.createdAt)}</td>
                  <td>{log.actorName || "Unknown"}{log.actorEmail ? <div className="text-muted">{log.actorEmail}</div> : null}</td>
                      <td>{formatRole(log.actorRole || (["user_created", "user_updated", "user_activated", "user_deactivated", "user_deleted"].includes(log.action) ? "admin" : ""))}</td>
                  <td>{actionLabels[log.action] || log.action}</td>
                </tr>
              ))}
              {loading && <tr><td colSpan="5" style={{ textAlign: "center" }}>Loading audit history...</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="panel-toolbar" style={{ marginTop: "1rem" }}>
          <span className="text-muted">Page {page} of {Math.max(result.pages, 1)}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="secondary-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} aria-label="Previous page">
              <ChevronLeft size={16} />
            </button>
            <button className="secondary-button" onClick={() => setPage((current) => Math.min(result.pages, current + 1))} disabled={page >= result.pages || loading} aria-label="Next page">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
import { BookMarked, Clock, CheckCircle } from "lucide-react";

export function LecturerDashboardPage({ user, stats, items, isPeriodOpen, currentPeriod }) {
  const firstName = user?.name?.split(" ")[0]?.toUpperCase() ?? "";
  const fullName = user?.name?.toUpperCase() ?? "";

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Period Status Notification Banner */}
      {isPeriodOpen && currentPeriod ? (
        <div style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          color: "var(--success)",
          borderRadius: "var(--radius)",
          padding: "1rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--success)" }}>📖 Book Submission Period Open</h4>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
              The library is accepting book recommendations for the <strong>Engineering</strong> faculty.
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: "0.875rem" }}>
            <strong>Deadline:</strong> {new Date(currentPeriod.endDate).toLocaleDateString('en-GB')}
          </div>
        </div>
      ) : (
        <div style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          color: "var(--danger)",
          borderRadius: "var(--radius)",
          padding: "1rem 1.5rem"
        }}>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--danger)" }}>🔒 Submissions Closed</h4>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Book recommendation submissions are currently closed. Please wait until the librarian opens a new order period.
          </p>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.5rem"
      }}>
        <MetricCard
          icon={<BookMarked size={22} />}
          label="Total Submissions"
          value={stats.total ?? 0}
        />
        <MetricCard
          icon={<Clock size={22} />}
          label="Pending Review"
          value={stats.pending ?? 0}
        />
        <MetricCard
          icon={<CheckCircle size={22} />}
          label="Total Approved"
          value={stats.approved ?? 0}
        />
      </div>

      {/* Recent Submissions Panel */}
      <div className="large-panel">
        <h2 className="panel-title">Recent Submissions</h2>

        {items.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "var(--text-muted)",
            fontSize: "0.9375rem",
            fontWeight: 500,
            letterSpacing: "0.04em",
            
          }}>
            No Submissions Yet
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.875rem" }}>
            {items.slice(0, 5).map((item) => (
              <RecentRow key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({ icon, label, value, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`metric-card admin-stat-card${onClick ? " clickable-metric" : ""}`} onClick={onClick} type={onClick ? "button" : undefined}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">
          {icon}
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
    </Tag>
  );
}

function RecentRow({ item }) {
  const statusColors = {
    submitted: { bg: "var(--success-bg)", text: "var(--success-text)", border: "var(--success-border)" },
    under_review: { bg: "rgba(236, 72, 153, 0.15)", text: "#ec4899", border: "rgba(236, 72, 153, 0.3)" },
    rejected: { bg: "var(--danger-bg)", text: "var(--danger-text)", border: "var(--danger-border)" }
  };
  const sc = statusColors[item.status] ?? statusColors.submitted;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem 1.25rem",
      background: "var(--surface-hover)",
      borderRadius: "var(--radius)",
      border: "1px solid var(--border)"
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)" }}>
          {item.title}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
          {item.author}{item.publisher ? ` · ${item.publisher}` : ""}
        </div>
      </div>
      <span style={{
        padding: "0.25rem 0.75rem",
        borderRadius: "2rem",
        fontSize: "0.7rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        background: sc.bg,
        color: sc.text,
        border: `1px solid ${sc.border}`
      }}>
        {item.status?.replace("_", " ") ?? "submitted"}
      </span>
    </div>
  );
}

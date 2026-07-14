import { DashboardContent } from "../../components/DashboardContent";

export function HodDashboardPage({ user, stats, items, isPeriodOpen, currentPeriod, onTotalClick, onPendingClick, onHighPriorityClick }) {
  // Filter items to only those in the current HOD order period (if available)
  // Only show books belonging to the active HOD order period. If none is active show no books.
  const hodItems = currentPeriod
    ? items.filter((it) => {
        const op = it.orderPeriod;
        const opId = op ? (op._id || op) : null;
        return opId && String(opId) === String(currentPeriod._id);
      })
    : [];

  // derive simple stats for the HOD view
  const hodStats = {
    total: hodItems.length,
    pending: hodItems.filter((item) => Number.isFinite(item.priorityRank)).length,
    rejected: hodItems.filter((item) => item.status === "rejected").length,
    highPriority: hodItems.filter((item) => item.priorityRank === 1).length,
    lecturersCount: new Set(hodItems.filter(r => r.submittedBy && r.status !== 'rejected').map(r => r.submittedBy._id || r.submittedBy)).size
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {isPeriodOpen && currentPeriod ? (
        <div style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          color: "var(--success)",
          borderRadius: "var(--radius)",
          padding: "1rem 1.5rem"
        }}>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--success)" }}>✏️ HOD Priority Assignment Open</h4>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            The priority assignment period is currently active for <strong>{currentPeriod.faculty}</strong>. Please review and assign priorities to lecturer recommendations.
          </p>
        </div>
      ) : (
        <div style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          color: "var(--danger)",
          borderRadius: "var(--radius)",
          padding: "1rem 1.5rem"
        }}>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--danger)" }}>🔒 HOD Priority Assignment Closed</h4>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            The priority assignment period is currently closed. Please wait until the librarian transitions the order period to the HOD Priority Assignment phase.
          </p>
        </div>
      )}
      <DashboardContent
        user={user}
        stats={hodStats}
        items={hodItems}
        onTotalClick={onTotalClick}
        onPendingClick={onPendingClick}
        onHighPriorityClick={onHighPriorityClick}
      />
    </section>
  );
}

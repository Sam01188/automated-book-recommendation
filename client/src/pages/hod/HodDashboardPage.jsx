import { DashboardContent } from "../../components/DashboardContent";

export function HodDashboardPage({ user, stats, items, isPeriodOpen, currentPeriod }) {
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
        stats={stats}
        items={items}
      />
    </section>
  );
}

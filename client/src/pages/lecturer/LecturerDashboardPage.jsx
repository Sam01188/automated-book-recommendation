import { BookMarked, CheckCircle, Clock } from "lucide-react";

export function LecturerDashboardPage({ user, stats, items }) {
  const firstName = user?.name?.split(" ")[0]?.toUpperCase() ?? "";
  const fullName = user?.name?.toUpperCase() ?? "";

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Welcome Heading */}
      <h2 style={{
        fontSize: "1.75rem",
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: "0.02em",
        textTransform: "capitalize"
      }}>
        Welcome, {user?.name ?? ""}!
      </h2>

      {/* Metric Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1.5rem"
      }}>
        <MetricCard
          icon={<BookMarked size={22} />}
          label="Total Submissions"
          value={stats.total ?? 0}
          sub="ALL TIME"
        />
        <MetricCard
          icon={<Clock size={22} />}
          label="Pending Review"
          value={stats.pending ?? 0}
          sub="AWAITING APPROVAL"
        />
        <MetricCard
          icon={<CheckCircle size={22} />}
          label="Approved"
          value={stats.approved ?? 0}
          sub="READY"
        />
      </div>

      {/* Recent Submissions Panel */}
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
        padding: "2rem"
      }}>
        <h3 style={{
          fontSize: "0.875rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text)",
          marginBottom: "1.5rem"
        }}>
          Recent Submissions
        </h3>

        {items.length === 0 ? (
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

function MetricCard({ icon, label, value, sub }) {
  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      boxShadow: "var(--shadow-sm)",
      transition: "all 0.25s ease"
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "var(--shadow-lg)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          fontSize: "0.8rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)"
        }}>
          {label}
        </span>
        <span style={{
          color: "var(--primary)",
          background: "var(--background)",
          borderRadius: "var(--radius-sm)",
          padding: "0.35rem",
          display: "flex",
          alignItems: "center"
        }}>
          {icon}
        </span>
      </div>
      <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>
        {sub}
      </div>
    </div>
  );
}

function RecentRow({ item }) {
  const statusColors = {
    submitted: { bg: "#dbeafe", text: "#7288d3" },
    under_review: { bg: "#fef3c7", text: "#c49171" },
    approved: { bg: "#dcfce7", text: "#2da55b" },
    rejected: { bg: "#fee2e2", text: "#b73030" }
  };
  const sc = statusColors[item.status] ?? statusColors.submitted;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem 1.25rem",
      background: "var(--background)",
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
        color: sc.text
      }}>
        {item.status?.replace("_", " ") ?? "submitted"}
      </span>
    </div>
  );
}

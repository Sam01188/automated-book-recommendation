export function MyRecommendationsPage({ items }) {
  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow)",
      padding: "2rem"
    }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "0.35rem"
        }}>
          My Book Recommendations
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 400 }}>
          Track the status of your submitted recommendations
        </p>
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div style={{
          background: "var(--background)",
          borderRadius: "var(--radius)",
          padding: "3.5rem 2rem",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "0.9375rem",
          fontWeight: 500
        }}>
          No book recommendations found.
        </div>
      ) : (
        /* Table */
        <div style={{
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Title", "Author", "Publisher", "Edition", "Year", "Binding", "Copies", "Price (LKR)", "Status", "Priority"].map((col) => (
                  <th key={col} style={{
                    background: "var(--background)",
                    padding: "0.875rem 1rem",
                    textAlign: "left",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap"
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <RecommendationRow key={item._id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecommendationRow({ item }) {
  const statusMap = {
    submitted:    { bg: "#dbeafe", text: "#1e40af", label: "Submitted" },
    under_review: { bg: "#fef3c7", text: "#92400e", label: "Under Review" },
    approved:     { bg: "#dcfce7", text: "#166534", label: "Approved" },
    rejected:     { bg: "#fee2e2", text: "#991b1b", label: "Rejected" }
  };
  const priorityMap = {
    high:       { bg: "#fee2e2", text: "#991b1b" },
    medium:     { bg: "#fef3c7", text: "#92400e" },
    low:        { bg: "#dcfce7", text: "#166534" },
    unassigned: { bg: "#f1f5f9", text: "#64748b" }
  };

  const sc = statusMap[item.status]   ?? statusMap.submitted;
  const pc = priorityMap[item.priority] ?? priorityMap.unassigned;

  const tdStyle = {
    padding: "1rem",
    borderTop: "1px solid var(--border)",
    fontSize: "0.875rem",
    color: "var(--text)",
    verticalAlign: "middle"
  };

  return (
    <tr style={{ transition: "background 0.15s" }}
      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = "var(--background)")}
      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = "")}
    >
      <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 220 }}>
        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </div>
      </td>
      <td style={tdStyle}>{item.author ?? "—"}</td>
      <td style={tdStyle}>{item.publisher ?? "—"}</td>
      <td style={tdStyle}>{item.edition ?? "—"}</td>
      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.publicationYear ?? "—"}</td>
      <td style={tdStyle}>{item.binding ?? "—"}</td>
      <td style={{ ...tdStyle, textAlign: "center" }}>{item.copies ?? "—"}</td>
      <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
        {item.price ? Number(item.price).toLocaleString() : "—"}
      </td>
      <td style={tdStyle}>
        <span style={{
          padding: "0.2rem 0.65rem",
          borderRadius: "2rem",
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          background: sc.bg,
          color: sc.text,
          whiteSpace: "nowrap"
        }}>
          {sc.label}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{
          padding: "0.2rem 0.65rem",
          borderRadius: "2rem",
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          background: pc.bg,
          color: pc.text
        }}>
          {item.priority ?? "unassigned"}
        </span>
      </td>
    </tr>
  );
}

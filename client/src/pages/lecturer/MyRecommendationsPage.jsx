export function MyRecommendationsPage({ items }) {
  return (
    <div style={{
      background: "var(--surface-solid)",
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
          background: "var(--surface-hover)",
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: "1100px", width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Title", "Author", "ISBN Number", "Publisher", "Edition", "Year", "Binding", "Copies", "Price (LKR)", "Status", "Priority"].map((col) => (
                  <th key={col} style={{
                    background: "var(--surface-hover)",
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
        </div>
      )}
    </div>
  );
}

function RecommendationRow({ item }) {
  const statusMap = {
    submitted:    { bg: "var(--admin-action-bg)", text: "var(--primary-light)", border: "var(--border-bright)", label: "Submitted" },
    under_review: { bg: "var(--warning-bg)", text: "var(--warning-text)", border: "var(--warning-border)", label: "Under Review" },
    approved:     { bg: "var(--success-bg)", text: "var(--success-text)", border: "var(--success-border)", label: "Approved" },
    rejected:     { bg: "var(--danger-bg)", text: "var(--danger-text)", border: "var(--danger-border)", label: "Rejected" }
  };
  const priorityMap = {
    high:       { bg: "var(--danger-bg)", text: "var(--danger-text)", border: "var(--danger-border)" },
    medium:     { bg: "var(--warning-bg)", text: "var(--warning-text)", border: "var(--warning-border)" },
    low:        { bg: "var(--success-bg)", text: "var(--success-text)", border: "var(--success-border)" },
    unassigned: { bg: "var(--surface-hover)", text: "var(--text-muted)", border: "var(--border)" }
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
      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = "var(--table-row-hover)")}
      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = "")}
    >
      <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 220 }}>
        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </div>
      </td>
      <td style={tdStyle}>{item.author ?? "—"}</td>
      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.isbn ?? "—"}</td>
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
          border: `1px solid ${sc.border}`,
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
          color: pc.text,
          border: `1px solid ${pc.border}`
        }}>
          {item.priority ?? "unassigned"}
        </span>
      </td>
    </tr>
  );
}

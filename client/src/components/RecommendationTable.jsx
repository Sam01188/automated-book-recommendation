export function RecommendationTable({ items, title, compact }) {
  return (
    <div className="large-panel">
      {title && <h2 className="panel-title">{title}</h2>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Publisher</th>
              <th>Submitted By</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td style={{ fontWeight: 600 }}>{item.title}</td>
                <td>{item.author}</td>
                <td>{item.publisher}</td>
                <td>{item.submittedBy?.name || "Lecturer"}</td>
                <td>
                  <span style={{
                    padding: "0.2rem 0.65rem",
                    borderRadius: "2rem",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: item.priorityRank ? "rgba(var(--primary-rgb), 0.15)" : "var(--surface-hover)",
                    color: item.priorityRank ? "var(--primary)" : "var(--text-muted)",
                    border: `1px solid ${item.priorityRank ? "rgba(var(--primary-rgb), 0.3)" : "var(--border)"}`
                  }}>
                    {item.priorityRank ? `Rank ${item.priorityRank}` : "unassigned"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
              <th style={{ width: 96, textAlign: "center" }}>Rank</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td style={{ fontWeight: 600 }}>{item.title}</td>
                <td>{item.author}</td>
                <td>{item.publisher}</td>
                <td>{item.submittedBy?.name || "Lecturer"}</td>
                <td style={{ textAlign: "center" }}>
                  <span className={`rank-badge ${item.priorityRank ? 'assigned' : 'unassigned'}`} title={item.priorityRank ? `Rank ${item.priorityRank}` : 'Unassigned'}>
                    {item.priorityRank ?? "-"}
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

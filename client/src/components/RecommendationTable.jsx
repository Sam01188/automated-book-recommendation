export function RecommendationTable({ items, title, compact, onPriority }) {
  return (
    <div className="large-panel">
      <h2 className="panel-title">{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Publisher</th>
              <th>Submitted By</th>
              <th>Priority</th>
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
                  {onPriority ? (
                    <select 
                      value={item.priority} 
                      onChange={(event) => onPriority(item._id, event.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                    >
                      <option value="unassigned">Set priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  ) : (
                    <span className={`priority ${item.priority}`}>{item.priority}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

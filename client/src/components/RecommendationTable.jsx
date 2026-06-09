export function RecommendationTable({ items, title, compact, onPriority }) {
  const maxRank = items.length;
  const rankOptions = Array.from({ length: maxRank }, (_, index) => String(index + 1));
  const usedRanks = new Set(
    items
      .map((item) => Number(item.priority))
      .filter((rank) => Number.isFinite(rank) && rank > 0)
  );

  const selectedPriority = (priority) => {
    const rank = Number(priority);
    return Number.isFinite(rank) && rank > 0 ? String(rank) : "unassigned";
  };

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
                      value={selectedPriority(item.priority)}
                      onChange={(event) => onPriority(item._id, event.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                    >
                      <option value="unassigned">Assign rank</option>
                      {rankOptions.map((rank) => (
                        <option
                          key={rank}
                          value={rank}
                          disabled={usedRanks.has(Number(rank)) && selectedPriority(item.priority) !== rank}
                        >
                          {rank}
                        </option>
                      ))}
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

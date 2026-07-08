import { RecommendationTable } from "../../components/RecommendationTable";

function getPrioritySortValue(item) {
  const rank = Number(item.priority);
  if (Number.isFinite(rank)) return rank;
  return Number.MAX_SAFE_INTEGER;
}

export function PriorityPage({ items, onPriority }) {
  const activeItems = items.filter((item) => item.status !== "submitted" || !item.reviewedBy);
  const sortedItems = activeItems.slice().sort((a, b) => getPrioritySortValue(a) - getPrioritySortValue(b));

  return (
    <div className="large-panel">
      <div className="guidelines priority-guidelines">
        <strong>Assign Priority</strong>
        <p style={{ marginTop: "0.5rem" }}>
          Assign a unique priority number to each recommendation. Use the dropdown at the end of each row. Numbers are 1 through the number of recommendations ({count}).
        </p>
      </div>

      {count === 0 ? (
        <p>No pending recommendations available.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 70 }}>Rank</th>
                <th>Title</th>
                <th>Author</th>
                <th>Publisher</th>
                <th>Submitted By</th>
                <th style={{ width: 160 }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item, index) => (
                <tr key={item._id}>
                  <td style={{ fontWeight: 700 }}>{index + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.title}</td>
                  <td>{item.author}</td>
                  <td>{item.publisher}</td>
                  <td>{item.submittedBy?.name || "Lecturer"}</td>
                  <td>
                    <select
                      value={ranks[item._id] ?? ""}
                      onChange={(e) => handleSelect(item._id, e.target.value)}
                      disabled={!isPeriodOpen}
                      style={{ padding: "0.35rem 0.5rem" }}
                    >
                      <option value="">Select priority</option>
                      {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {count > 0 && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
          <button className="primary-button" onClick={handleSave} disabled={!isPeriodOpen || saving}>
            Save Priorities
          </button>
        </div>
      )}

      <div className="guidelines priority-guidelines">
        <strong>Priority Assignment Guidelines</strong>
        <ul className="guideline-list">
          <li className="guideline-item">
            <span className="guideline-term high">1</span>
            Assign rank 1 to the most urgent recommendation
          </li>
          <li className="guideline-item">
            <span className="guideline-term medium">2</span>
            Assign rank 2 to the next most important recommendation
          </li>
          <li className="guideline-item">
            <span className="guideline-term low">3+</span>
            Use higher numbers for lower priority recommendations
          </li>
        </ul>
      </div>
      {sortedItems.length === 0 ? (
        <p>No pending recommendations available for priority assignment.</p>
      ) : (
        <RecommendationTable items={sortedItems} compact onPriority={onPriority} title="Priority Ranking" />
      )}
    </div>
  );
}

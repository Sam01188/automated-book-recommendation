import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";

export function HodRankTable({ items, title, onOrderChange, disabled }) {
  const sortedItems = [...items].sort((a, b) => {
    const aRank = Number.isFinite(a.priorityRank) ? a.priorityRank : Number.MAX_SAFE_INTEGER;
    const bRank = Number.isFinite(b.priorityRank) ? b.priorityRank : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  function saveOrder(nextItems) {
    onOrderChange?.(nextItems.map((item) => item._id));
  }

  function moveItem(index, direction) {
    const nextIndex = index + direction;
    if (disabled || nextIndex < 0 || nextIndex >= sortedItems.length) return;
    const next = [...sortedItems];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    saveOrder(next);
  }

  function handleDrop(event, dropIndex) {
    event.preventDefault();
    if (disabled) return;
    const dragIndex = Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isInteger(dragIndex) || dragIndex === dropIndex) return;

    const next = [...sortedItems];
    const [dragged] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, dragged);
    saveOrder(next);
  }

  return (
    <div className="large-panel">
      {title && <h2 className="panel-title">{title}</h2>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 70 }}>Rank</th>
              <th>Title</th>
              <th>Author</th>
              <th>Publisher</th>
              <th>Submitted By</th>
              {!disabled && <th style={{ width: 130 }}>Order</th>}
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 5 : 6}>No recommendations available.</td>
              </tr>
            ) : (
              sortedItems.map((item, index) => (
                <tr
                  key={item._id}
                  draggable={!disabled}
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, index)}
                >
                  <td style={{ fontWeight: 700 }}>{index + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.title}</td>
                  <td>{item.author}</td>
                  <td>{item.publisher}</td>
                  <td>{item.submittedBy?.name || "Lecturer"}</td>
                  {!disabled && (
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <button className="secondary-button" type="button" disabled={disabled} onClick={() => moveItem(index, -1)} title="Move up">
                          <ArrowUp size={16} />
                        </button>
                        <button className="secondary-button" type="button" disabled={disabled} onClick={() => moveItem(index, 1)} title="Move down">
                          <ArrowDown size={16} />
                        </button>
                        <GripVertical size={18} color="var(--text-muted)" aria-hidden="true" />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

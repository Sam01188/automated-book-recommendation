import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle, GripVertical, RotateCcw, XCircle } from "lucide-react";

export function AllRecommendationsPage({
  items,
  filterPriority = "all",
  onOrderChange,
  isPeriodOpen,
  currentPeriod,
  token,
  onReject,
  onRestore,
}) {
  const [rejecting, setRejecting] = useState(null);
  const [restoring, setRestoring] = useState(null);

  // Active items: not rejected, not yet submitted to librarian — sorted by submission date (oldest first = submission order)
  const activeItems = items
    .filter(
      (item) =>
        item.status !== "rejected" &&
        (item.status !== "submitted" || !item.reviewedBy)
    )
    .sort((a, b) => {
      // Items with a priorityRank go first (in rank order), unranked follow in submission order
      const aRank = Number.isFinite(a.priorityRank) ? a.priorityRank : Number.MAX_SAFE_INTEGER;
      const bRank = Number.isFinite(b.priorityRank) ? b.priorityRank : Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      // Within same rank group, sort by submission date ascending
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  const rejectedItems = items.filter((item) => item.status === "rejected");

  const filteredActive =
    filterPriority === "high"
      ? activeItems.filter((item) => item.priorityRank === 1)
      : activeItems;

  const submittedItems = items.filter((item) => item.submittedToLibrarianAt);
  const isAlreadySubmitted = submittedItems.length > 0;

  // ── drag-and-drop / reorder helpers ──────────────────────────────────────
  function saveOrder(nextItems) {
    onOrderChange?.(nextItems.map((item) => item._id));
  }

  function moveItem(index, direction) {
    if (!isPeriodOpen || isAlreadySubmitted) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= filteredActive.length) return;
    const next = [...filteredActive];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    saveOrder(next);
  }

  function handleDrop(event, dropIndex) {
    event.preventDefault();
    if (!isPeriodOpen || isAlreadySubmitted) return;
    const dragIndex = Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isInteger(dragIndex) || dragIndex === dropIndex) return;
    const next = [...filteredActive];
    const [dragged] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, dragged);
    saveOrder(next);
  }

  // ── reject handler ────────────────────────────────────────────────────────
  async function handleReject(item) {
    if (!isPeriodOpen || isAlreadySubmitted) return;
    setRejecting(item._id);
    try {
      await onReject?.(item._id);
    } catch (err) {
      alert(err.message || "Failed to reject recommendation");
    } finally {
      setRejecting(null);
    }
  }

  // ── restore handler ───────────────────────────────────────────────────────
  async function handleRestore(item) {
    if (!isPeriodOpen) return;
    setRestoring(item._id);
    try {
      await onRestore?.(item._id);
    } catch (err) {
      alert(err.message || "Failed to restore recommendation");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="large-panel">
      {/* ── Period closed banner ─────────────────────────────────────────── */}
      {!isPeriodOpen && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)",
            color: "var(--danger)",
            borderRadius: "var(--radius)",
            padding: "1rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(239, 68, 68, 0.35)",
          }}
        >
          ⚠️ HOD Priority Assignment Period is closed. Submitting to the
          librarian or assigning priorities is disabled.
        </div>
      )}

      {/* ── Already submitted banner ─────────────────────────────────────── */}
      {isAlreadySubmitted && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)",
            color: "var(--success)",
            borderRadius: "var(--radius)",
            padding: "1rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <CheckCircle size={20} />
          ✅ Your recommendations have been submitted to the librarian
        </div>
      )}

      {/* ── Guidelines ───────────────────────────────────────────────────── */}
      <div className="guidelines priority-guidelines">
        <strong>Priority Assignment Guidelines</strong>
        <ul className="guideline-list">
          <li className="guideline-item">
            <span className="guideline-term high">1</span>
            Most important recommendation for the department
          </li>
          <li className="guideline-item">
            <span className="guideline-term medium">2, 3, 4…</span>
            Continue in descending order by dragging rows or using the arrow
            buttons
          </li>
          <li className="guideline-item">
            <span className="guideline-term" style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)", minWidth: 56, textAlign: "center", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>
              ✕ Reject
            </span>
            Remove a recommendation from the list — it will appear in the
            Rejected table below where it can be restored if needed
          </li>
        </ul>
      </div>

      {/* ── Priority / Active recommendations table ───────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
          marginTop: "1.5rem",
        }}
      >
        <h2 className="panel-title" style={{ margin: 0 }}>
          Department Recommendation Order
        </h2>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Title</th>
              <th>Author</th>
              <th>Publisher</th>
              <th>Submitted By</th>
              <th style={{ width: 120 }}>Order</th>
              {isPeriodOpen && !isAlreadySubmitted && (
                <th style={{ width: 90 }}>Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredActive.length === 0 ? (
              <tr>
                <td colSpan={isPeriodOpen && !isAlreadySubmitted ? 7 : 6}>
                  No active recommendations available.
                </td>
              </tr>
            ) : (
              filteredActive.map((item, index) => (
                <tr
                  key={item._id}
                  draggable={isPeriodOpen && !isAlreadySubmitted}
                  onDragStart={(event) =>
                    event.dataTransfer.setData("text/plain", String(index))
                  }
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, index)}
                  style={{
                    cursor:
                      isPeriodOpen && !isAlreadySubmitted ? "grab" : "default",
                  }}
                >
                  <td style={{ fontWeight: 700 }}>{index + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.title}</td>
                  <td>{item.author}</td>
                  <td>{item.publisher}</td>
                  <td>{item.submittedBy?.name || "Lecturer"}</td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={!isPeriodOpen || isAlreadySubmitted}
                        onClick={() => moveItem(index, -1)}
                        title="Move up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={!isPeriodOpen || isAlreadySubmitted}
                        onClick={() => moveItem(index, 1)}
                        title="Move down"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <GripVertical
                        size={18}
                        color="var(--text-muted)"
                        aria-hidden="true"
                      />
                    </div>
                  </td>
                  {isPeriodOpen && !isAlreadySubmitted && (
                    <td>
                      <button
                        className="secondary-button"
                        type="button"
                        title="Reject recommendation"
                        disabled={rejecting === item._id}
                        onClick={() => handleReject(item)}
                        style={{
                          color: "var(--danger)",
                          borderColor: "rgba(239,68,68,0.35)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontSize: "0.82rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <XCircle size={15} />
                        {rejecting === item._id ? "…" : "Reject"}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Rejected books table ─────────────────────────────────────────── */}
      <div style={{ marginTop: "2.5rem" }}>
        <h2 className="panel-title" style={{ marginBottom: "0.75rem" }}>
          Rejected Recommendations
        </h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Publisher</th>
                <th>Submitted By</th>
                {isPeriodOpen && !isAlreadySubmitted && (
                  <th style={{ width: 110 }}>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rejectedItems.length === 0 ? (
                <tr>
                  <td colSpan={isPeriodOpen && !isAlreadySubmitted ? 5 : 4}>
                    No rejected recommendations.
                  </td>
                </tr>
              ) : (
                rejectedItems.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>
                      {item.title}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{item.author}</td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {item.publisher}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {item.submittedBy?.name || "Lecturer"}
                    </td>
                    {isPeriodOpen && !isAlreadySubmitted && (
                      <td>
                        <button
                          className="secondary-button"
                          type="button"
                          title="Restore to priority list"
                          disabled={restoring === item._id}
                          onClick={() => handleRestore(item)}
                          style={{
                            color: "var(--success)",
                            borderColor: "rgba(16,185,129,0.35)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.82rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <RotateCcw size={14} />
                          {restoring === item._id ? "…" : "Restore"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

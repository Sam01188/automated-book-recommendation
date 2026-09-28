import { useEffect, useMemo, useState } from "react";
import { AppModal } from "../../components/AppModal";

export function PriorityPage({ items, onOrderChange, isPeriodOpen }) {
  const activeItems = useMemo(
    () => items.filter((item) => item.status !== "rejected" && (item.status !== "submitted" || !item.reviewedBy)),
    [items]
  );

  const count = activeItems.length;
  const [ranks, setRanks] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial = {};
    activeItems.forEach((it, idx) => {
      initial[it._id] = Number.isFinite(it.priorityRank) ? it.priorityRank : null;
    });
    setRanks(initial);
  }, [items]);

  function handleSelect(id, value) {
    const newRank = value === "" ? null : Number(value);
    setRanks((prev) => {
      const prevRank = prev[id];
      if (prevRank === newRank) return prev;

      const next = { ...prev };
      // If selecting null, just clear this id
      if (newRank === null) {
        next[id] = null;
        return next;
      }

      // If another item already has the selected rank, swap their ranks
      const swappedId = Object.keys(prev).find((k) => prev[k] === newRank);
      next[id] = newRank;
      if (swappedId) next[swappedId] = prevRank ?? null;
      return next;
    });
  }

  async function handleSave() {
    if (!onOrderChange) return;
    setSaving(true);
    try {
      // Only persist ranks that the user explicitly selected (keep others null)
      const selected = { ...ranks };
      const rankedIds = Object.keys(selected).filter((k) => Number.isFinite(selected[k]));
      // If no ranks selected, abort and inform user
      if (rankedIds.length === 0) {
        setModal({ title: "No Priorities Selected", message: "Please select at least one priority before saving.", confirmText: "OK", onConfirm: () => setModal(null) });
        return;
      }

      // Prevent duplicate priority numbers
      const rankValues = rankedIds.map((id) => selected[id]);
      const uniqueRanks = new Set(rankValues);
      if (uniqueRanks.size !== rankValues.length) {
        setModal({ title: "Duplicate Ranks", message: "Each priority number must be unique. Please remove duplicate numbers before saving.", confirmText: "OK", onConfirm: () => setModal(null) });
        return;
      }
      // Build ordered list of items that have a selected rank
      const ordered = [...activeItems]
        .filter((it) => Number.isFinite(selected[it._id]))
        .sort((a, b) => selected[a._id] - selected[b._id]);

      // update local ranks to reflect saved selected values (leave others null)
      const finalRanks = {};
      activeItems.forEach((it) => {
        finalRanks[it._id] = Number.isFinite(selected[it._id]) ? selected[it._id] : null;
      });
      setRanks(finalRanks);
      const orderedIds = ordered.map((it) => it._id);
      // detect items that were previously ranked but now left unassigned
      const clearedIds = activeItems
        .filter((it) => !Number.isFinite(selected[it._id]) && Number.isFinite(it.priorityRank))
        .map((it) => it._id);
      await onOrderChange({ orderedIds, clearedIds });
      setModal({ title: "Success", message: "Priorities saved successfully.", confirmText: "OK", onConfirm: () => setModal(null) });
    } catch (err) {
      console.error(err);
      setModal({ title: "Failed to Save", message: err.message || "Failed to save priorities", variant: "danger", confirmText: "OK", onConfirm: () => setModal(null) });
    } finally {
      setSaving(false);
    }
  }

  const [modal, setModal] = useState(null);

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

      {modal && (
        <AppModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          variant={modal.variant}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}
    </div>
  );
}

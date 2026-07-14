import { useMemo, useState } from "react";
import { RecommendationTable } from "../../components/RecommendationTable";

export function HodSubmissionsPage({ items = [], currentUserId, periods = [], currentPeriod = null }) {
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  // derive submitted items by this HOD
  const submittedItems = useMemo(() => {
    return items
      .filter((item) => {
        const reviewedById = item.reviewedBy?._id || item.reviewedBy;
        return item.status === "submitted" && String(reviewedById) === String(currentUserId);
      })
      .sort((a, b) => {
        const aRank = Number.isFinite(a.priorityRank) ? a.priorityRank : Number.MAX_SAFE_INTEGER;
        const bRank = Number.isFinite(b.priorityRank) ? b.priorityRank : Number.MAX_SAFE_INTEGER;
        return aRank - bRank || new Date(a.createdAt) - new Date(b.createdAt);
      });
  }, [items, currentUserId]);

  const visibleItems = useMemo(() => {
    if (selectedPeriod === "all") return submittedItems;
    if (selectedPeriod === "current") {
      if (!currentPeriod) return [];
      return submittedItems.filter((it) => {
        const op = it.orderPeriod;
        const id = op ? (op._id || op) : null;
        return id && String(id) === String(currentPeriod._id);
      });
    }
    // specific period id
    return submittedItems.filter((it) => {
      const op = it.orderPeriod;
      const id = op ? (op._id || op) : null;
      return id && String(id) === String(selectedPeriod);
    });
  }, [submittedItems, selectedPeriod, currentPeriod]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ color: "var(--text-muted)" }}>Filter by period:</span>
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            <option value="current">Current Period</option>
            <option value="all">All</option>
            {periods.map((p) => (
              <option key={p._id || p} value={p._id || p}>
                {p.faculty || `${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <RecommendationTable items={visibleItems} title="Submitted to Librarian" />
    </div>
  );
}

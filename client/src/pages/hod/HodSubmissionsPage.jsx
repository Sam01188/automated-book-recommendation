import { useEffect, useMemo, useState } from "react";
import { RecommendationTable } from "../../components/RecommendationTable";
import { fetchHodSubmissions } from "../../api";

export function HodSubmissionsPage({ token, periods = [], currentPeriod = null }) {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const queryPeriodId = selectedPeriod === "current" ? currentPeriod?._id || "current" : selectedPeriod;
  const latestPeriodId = periods.reduce((latestId, period) => {
    if (!latestId) return period._id;
    const latestPeriod = periods.find((item) => String(item._id) === String(latestId));
    return new Date(period.createdAt || period.startDate) > new Date(latestPeriod.createdAt || latestPeriod.startDate)
      ? period._id
      : latestId;
  }, null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetchHodSubmissions(token, queryPeriodId)
      .then((records) => {
        if (active) setItems(records);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.message || "Failed to load HoD submissions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, queryPeriodId]);

  const visibleItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aRank = Number.isFinite(a.priorityRank) ? a.priorityRank : Number.MAX_SAFE_INTEGER;
        const bRank = Number.isFinite(b.priorityRank) ? b.priorityRank : Number.MAX_SAFE_INTEGER;
        return aRank - bRank || new Date(a.createdAt) - new Date(b.createdAt);
      }),
    [items]
  );

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
                {`${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}${String(p._id) === String(latestPeriodId) ? " (Latest)" : ""}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <p>Loading submissions...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        visibleItems.length > 0 ? (
          <RecommendationTable items={visibleItems} title="Submitted to Librarian" />
        ) : (
          <p>No books have been submitted to the librarian for this period.</p>
        )
      )}
    </div>
  );
}

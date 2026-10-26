import { useEffect, useState } from "react";
import { Badge } from "../../components/librarian/Badge";
import { fetchHodOrderStatus } from "../../api";

function getOrderPeriodLabel(period) {
  if (!period) return "-";
  if (period.faculty) return period.faculty;
  if (!period.startDate || !period.endDate) return "-";

  const start = new Date(period.startDate).toLocaleDateString();
  const end = new Date(period.endDate).toLocaleDateString();
  return `${start} - ${end}`;
}

export function HodOrderStatusPage({ token, periods = [], currentPeriod = null }) {
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

    const refreshStatuses = () => {
      fetchHodOrderStatus(token, queryPeriodId)
        .then((records) => {
          if (!active) return;
          setItems(records);
          setError("");
        })
        .catch((fetchError) => {
          if (active) setError(fetchError.message || "Failed to load book order statuses.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    refreshStatuses();
    const interval = setInterval(refreshStatuses, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token, queryPeriodId]);

  return (
    <section className="large-panel">
      <h2 className="panel-title">Librarian Order Status</h2>
      <p style={{ color: "var(--text-muted)", marginTop: "-0.5rem" }}>
        Books submitted to the librarian and marked as ordered.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ color: "var(--text-muted)" }}>Filter by period:</span>
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            <option value="current">Current Period</option>
            <option value="all">All</option>
            {periods.map((period) => (
              <option key={period._id} value={period._id}>
                {`${new Date(period.startDate).toLocaleDateString()} - ${new Date(period.endDate).toLocaleDateString()}${String(period._id) === String(latestPeriodId) ? " (Latest)" : ""}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <p>Loading order statuses...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : items.length === 0 ? (
        <p>No books are currently marked as ordered.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Book Name</th>
                <th>Edition</th>
                <th>Lecturer</th>
                <th>Order Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                return (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td>{item.edition || "-"}</td>
                    <td>{item.submittedBy?.name || "-"}</td>
                    <td>{getOrderPeriodLabel(item.orderPeriod)}</td>
                    <td>
                      <Badge label="Ordered" type="success" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
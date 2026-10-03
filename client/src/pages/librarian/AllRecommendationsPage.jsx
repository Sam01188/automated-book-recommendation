import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { DataTable } from "../../components/librarian/DataTable";
import { Badge } from "../../components/librarian/Badge";

export function AllRecommendationsPage({
  items = [],
  filterPriority = "all",
  currentPeriod = null,
  periods = [],
  selectedPeriod = null,
  onSelectedPeriodChange = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    setLocalItems(items || []);
  }, [items]);

  const sortedPeriods = useMemo(
    () =>
      [...periods].sort((a, b) => {
        const aDate = a?.endDate ? new Date(a.endDate).getTime() : 0;
        const bDate = b?.endDate ? new Date(b.endDate).getTime() : 0;
        return bDate - aDate;
      }),
    [periods]
  );

  const latestPeriod = sortedPeriods[0] || currentPeriod || null;

  useEffect(() => {
    if (!selectedPeriod && latestPeriod && latestPeriod._id) {
      onSelectedPeriodChange(latestPeriod._id);
    }
  }, [selectedPeriod, latestPeriod, onSelectedPeriodChange]);

  const effectiveSelectedPeriod = selectedPeriod || latestPeriod?._id || "all";
  const period =
    sortedPeriods.find((periodItem) => String(periodItem._id) === String(effectiveSelectedPeriod)) ||
    currentPeriod ||
    latestPeriod ||
    null;
  const periodStatus = period?.status;
  const isCurrentPeriod = periodStatus === "open" || periodStatus === "hod_priority";
  const periodLabel = period ? (isCurrentPeriod ? "Current Period" : "Previous Period") : "No Period Selected";

  const defaultDepartments = ["DCEE", "DEIE", "DMENA", "DMME"];
  const departments = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultDepartments,
          ...(localItems || []).map((item) => item.department).filter(Boolean)
        ])
      ).sort(),
    [localItems]
  );

  const filteredByPeriod = useMemo(() => {
    if (!effectiveSelectedPeriod || effectiveSelectedPeriod === "all") {
      return localItems || [];
    }

    return (localItems || []).filter((item) => {
      const itemPeriodId = item.orderPeriod?._id || item.orderPeriod;
      return itemPeriodId && String(itemPeriodId) === String(effectiveSelectedPeriod);
    });
  }, [localItems, effectiveSelectedPeriod]);

  const filteredItems = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return [...filteredByPeriod]
      .filter((item) => {
        const matchesSearch =
          item.title?.toLowerCase().includes(search) ||
          item.author?.toLowerCase().includes(search) ||
          item.isbn?.toLowerCase().includes(search);

        const matchesTab = activeTab === "all" || item.department === activeTab;
        const matchesPriority = filterPriority === "high" ? item.priorityRank === 1 : true;

        return matchesSearch && matchesTab && matchesPriority;
      })
      .sort((a, b) => {
        const departmentCompare = (a.department || "").localeCompare(b.department || "");
        if (departmentCompare !== 0) return departmentCompare;
        return (a.priorityRank || 9999) - (b.priorityRank || 9999);
      });
  }, [filteredByPeriod, searchTerm, activeTab, filterPriority]);

  const getStatusBadgeType = (status) => {
    const statusMap = {
      submitted: "warning",
      rejected: "danger",
      under_review: "info",
      selected: "primary",
      ordered: "info",
      bought: "success",
      delivered: "success",
      ready: "success"
    };
    return statusMap[status] || "default";
  };

  const columns = [
    { key: "department", label: "Department" },
    { key: "rank", label: "Rank" },
    { key: "title", label: "Title" },
    { key: "author", label: "Author" },
    { key: "isbn", label: "ISBN" },
    { key: "edition", label: "Edition" },
    { key: "copies", label: "Copies" },
    { key: "price", label: "Price" },
    { key: "publisher", label: "Publisher" },
    { key: "status", label: "Status" },
    { key: "submitted", label: "Submitted By" }
  ];

  const tableColumns = activeTab === "all" ? columns : columns.filter((col) => col.key !== "department");

  return (
    <div className="dashboard-container">
      <section className="large-panel" style={{ marginBottom: "1rem" }}>
        <Card
          className="full-width"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "0.25rem"
              }}
            >
              All Recommendations
            </div>
            <h3 style={{ margin: 0 }}>{period ? period.faculty || "Engineering Faculty" : "Engineering Faculty"}</h3>
          </div>
          <span className={`badge ${isCurrentPeriod ? "badge-success" : "badge-secondary"}`}>
            {periodLabel}
          </span>
        </Card>
      </section>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap"
        }}
      >
        <div className="search-wrapper" style={{ flex: 1, minWidth: "250px", position: "relative" }}>
          <Search
            size={18}
            className="search-icon"
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)"
            }}
          />
          <input
            type="text"
            placeholder="Search by title, author or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ width: "100%", paddingLeft: "2.5rem" }}
          />
        </div>

        {sortedPeriods.length > 0 && (
          <select
            value={effectiveSelectedPeriod}
            onChange={(e) => onSelectedPeriodChange(e.target.value)}
            className="table-input"
            style={{ minWidth: "240px" }}
          >
            <option value="all">All Periods</option>
            {sortedPeriods.map((periodItem) => {
              const startDate = new Date(periodItem.startDate).toLocaleDateString("en-GB");
              const endDate = new Date(periodItem.endDate).toLocaleDateString("en-GB");
              const isLatest = latestPeriod && String(periodItem._id) === String(latestPeriod._id);
              const suffix = isLatest ? " (Latest)" : periodItem.status === "open" || periodItem.status === "hod_priority" ? " (Current)" : "";
              return (
                <option key={periodItem._id} value={periodItem._id}>
                  {`${startDate} - ${endDate}${suffix}`}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {sortedPeriods.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1rem"
          }}
        >
          <button
            onClick={() => onSelectedPeriodChange("all")}
            style={{
              padding: "0.55rem 0.9rem",
              borderRadius: "999px",
              border: effectiveSelectedPeriod === "all" ? "1px solid var(--primary)" : "1px solid var(--border-color)",
              background: effectiveSelectedPeriod === "all" ? "rgba(88, 166, 255, 0.12)" : "var(--surface)",
              color: effectiveSelectedPeriod === "all" ? "var(--primary)" : "var(--text)",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            All periods
          </button>
          {sortedPeriods.map((periodItem) => {
            const isSelected = String(effectiveSelectedPeriod) === String(periodItem._id);
            const isLatest = latestPeriod && String(periodItem._id) === String(latestPeriod._id);
            const periodDate = `${new Date(periodItem.startDate).toLocaleDateString("en-GB")} - ${new Date(periodItem.endDate).toLocaleDateString("en-GB")}`;

            return (
              <button
                key={periodItem._id}
                onClick={() => onSelectedPeriodChange(periodItem._id)}
                style={{
                  padding: "0.55rem 0.9rem",
                  borderRadius: "999px",
                  border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                  background: isSelected
                    ? isLatest
                      ? "linear-gradient(135deg, rgba(255,179,71,0.18), rgba(88,166,255,0.18))"
                      : "rgba(88, 166, 255, 0.12)"
                    : isLatest
                      ? "rgba(255, 179, 71, 0.12)"
                      : "var(--surface)",
                  color: isSelected ? "var(--primary)" : "var(--text)",
                  cursor: "pointer",
                  fontWeight: isSelected ? 700 : 600,
                  boxShadow: isLatest ? "0 0 0 1px rgba(255,179,71,0.4)" : "none"
                }}
              >
                {periodDate}
                {isLatest && " • Latest"}
              </button>
            );
          })}
        </div>
      )}

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "0.5rem",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "2px"
        }}
      >
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "all" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "all" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease"
          }}
        >
          All Recommendations
        </button>
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveTab(dept)}
            style={{
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === dept ? "3px solid var(--primary)" : "3px solid transparent",
              color: activeTab === dept ? "var(--primary)" : "var(--text-muted)",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease"
            }}
          >
            {dept}
          </button>
        ))}
      </div>

      <section className="large-panel">
        <Card className="full-width">
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              No recommendations found matching the criteria.
            </div>
          ) : (
            <DataTable
              columns={tableColumns}
              data={filteredItems}
              renderRow={(item) => (
                <>
                  {activeTab === "all" && (
                    <td>
                      <span className="badge badge-info">{item.department || "Unassigned"}</span>
                    </td>
                  )}
                  <td>
                    <strong>{item.priorityRank || "N/A"}</strong>
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                  </td>
                  <td>{item.author}</td>
                  <td>{item.isbn || "N/A"}</td>
                  <td>{item.edition || "N/A"}</td>
                  <td>{item.copies ?? 0}</td>
                  <td>
                    {item.price ? `${item.currency || "LKR"} ${Number(item.price).toLocaleString()}` : "N/A"}
                  </td>
                  <td>{item.publisher}</td>
                  <td>
                    <Badge label={item.status} type={getStatusBadgeType(item.status)} />
                  </td>
                  <td className="text-muted">{item.submittedBy?.name || "N/A"}</td>
                </>
              )}
            />
          )}
        </Card>

        <div className="results-info" style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Showing {filteredItems.length} of {localItems.length} recommendations
        </div>
      </section>
    </div>
  );
}

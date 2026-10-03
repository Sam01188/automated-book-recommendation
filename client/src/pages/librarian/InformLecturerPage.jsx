import { useEffect, useMemo, useState } from "react";
import { BellRing, CheckCheck, MessageSquareText, Search, Send } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { fetchRecommendations, updateRecommendationStatus } from "../../api";

function getOrderedItems(items) {
  return [...items].sort((a, b) => {
    const departmentCompare = (a.department || "").localeCompare(b.department || "");
    if (departmentCompare !== 0) return departmentCompare;
    return (a.priorityRank || 9999) - (b.priorityRank || 9999);
  });
}

function getDepartmentKey(item) {
  return item.department || "Unassigned";
}

function getFinalDepartmentItems(items) {
  return getOrderedItems(
    items.filter((item) => item.status !== "rejected" && Number.isFinite(item.priorityRank))
  );
}

export function InformLecturerPage({ items = [], token, isPeriodLocked = false }) {
  const [localItems, setLocalItems] = useState(items);
  const [activeDepartment, setActiveDepartment] = useState("All Departments");
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLocalItems(items || []);
    setSelectedIds((prev) => prev.filter((id) => (items || []).some((it) => String(it._id) === String(id))));
  }, [items]);

  const finalDepartmentItems = useMemo(() => getFinalDepartmentItems(localItems), [localItems]);

  const departments = useMemo(() => {
    const grouped = {};
    finalDepartmentItems.forEach((item) => {
      const department = getDepartmentKey(item);
      if (!grouped[department]) grouped[department] = [];
      grouped[department].push(item);
    });
    return grouped;
  }, [finalDepartmentItems]);

  const departmentNames = ["All Departments", ...Object.keys(departments)];

  const previewItems = useMemo(() => {
    const filtered = activeDepartment === "All Departments"
      ? finalDepartmentItems
      : departments[activeDepartment] || [];

    const search = searchTerm.trim().toLowerCase();
    if (!search) return filtered;

    return filtered.filter((item) => {
      const haystack = [
        item.title,
        item.author,
        item.isbn,
        item.department,
        item.submittedBy?.name
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [activeDepartment, departments, finalDepartmentItems, searchTerm]);

  const allSelectedInView = previewItems.length > 0 && previewItems.every((item) => selectedIds.includes(item._id));

  function toggleSelection(id) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((currentId) => currentId !== id)
        : [...prev, id]
    );
  }

  function toggleSelectVisible() {
    if (!previewItems.length) return;

    const visibleIds = previewItems.map((item) => item._id);
    const hasAllVisible = visibleIds.every((id) => selectedIds.includes(id));

    if (hasAllVisible) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  }

  async function handleBulkStatusUpdate() {
    if (isPeriodLocked) {
      setNotice("The order period is still active. Please wait until the period is closed before informing lecturers.");
      return;
    }

    if (!selectedIds.length) {
      setNotice("Select at least one recommendation before sending the order update.");
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      await Promise.all(selectedIds.map((id) => updateRecommendationStatus(token, id, "ordered")));
      const refreshed = await fetchRecommendations(token, "librarian");
      setLocalItems(refreshed);
      setSelectedIds([]);
      setNotice("Selected books were marked as ordered and the lecturer update was sent.");
    } catch (error) {
      setNotice(error.message || "Failed to update selected recommendations.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard-container">
      {isPeriodLocked && (
        <section className="large-panel" style={{ borderColor: "rgba(239, 68, 68, 0.45)", background: "rgba(239, 68, 68, 0.04)" }}>
          <h3 className="panel-title" style={{ color: "var(--danger)" }}>Inform Lecturer Restricted</h3>
          <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            The order period is still active. Please wait until the period is closed before informing lecturers.
          </div>
        </section>
      )}

      <section className="large-panel export-preview-panel">
        <div className="panel-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <h3 className="panel-title" style={{ margin: 0 }}>
            <MessageSquareText size={18} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
            Inform Lecturer
          </h3>
          <div className="badge badge-primary">{finalDepartmentItems.length} final recommendations</div>
        </div>

        <div className="search-wrapper" style={{ marginTop: "1rem" }}>
          <Search size={18} className="search-icon" />
          <input
            className="search-input"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search title, author, ISBN or department..."
          />
        </div>

        <div className="export-tabs" role="tablist" aria-label="Department preview tabs" style={{ marginTop: "1rem" }}>
          {departmentNames.map((department) => (
            <button
              key={department}
              type="button"
              className={`export-tab ${activeDepartment === department ? "active" : ""}`}
              onClick={() => setActiveDepartment(department)}
            >
              {department}
              {department !== "All Departments" && (
                <span className="export-tab-count">{departments[department]?.length || 0}</span>
              )}
            </button>
          ))}
        </div>

        <div className="export-preview-table-wrap" style={{ marginTop: "1rem" }}>
          {previewItems.length === 0 ? (
            <p className="export-preview-empty">No ranked HoD recommendations available for this department.</p>
          ) : (
            <table className="export-preview-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={allSelectedInView}
                      onChange={toggleSelectVisible}
                      aria-label="Select visible items"
                    />
                  </th>
                  <th>Rank</th>
                  <th>Department</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewItems.map((item) => (
                  <tr key={item._id || `${item.title}-${item.department}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => toggleSelection(item._id)}
                        aria-label={`Select ${item.title}`}
                      />
                    </td>
                    <td><strong>{item.priorityRank || "-"}</strong></td>
                    <td>{getDepartmentKey(item)}</td>
                    <td>{item.title || "N/A"}</td>
                    <td>{item.author || "N/A"}</td>
                    <td>{item.submittedBy?.name || "N/A"}</td>
                    <td>
                      <span className={`badge ${item.status === "ordered" ? "badge-info" : item.status === "selected" ? "badge-primary" : "badge-secondary"}`}>
                        {item.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="large-panel">
        <div className="panel-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <h3 className="panel-title" style={{ margin: 0 }}>
            <BellRing size={18} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
            Lecturer Notification
          </h3>
          <div className="badge badge-secondary">{selectedIds.length} selected</div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <button
            className="btn btn-success btn-sm"
            type="button"
            disabled={busy || isPeriodLocked || selectedIds.length === 0}
            onClick={handleBulkStatusUpdate}
          >
            <Send size={16} /> Inform Lecturer: Ordered
          </button>
        </div>

        {notice && (
          <Card className="info-card" style={{ marginTop: "1rem" }}>
            <div className="info-content">
              <p>{notice}</p>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Pencil, Trash2, ChevronDown, Save, X as XIcon } from "lucide-react";
import { deleteRecommendation, updateRecommendation } from "../../api";
import { AppModal } from "../../components/AppModal";

export function MyRecommendationsPage({ items, isPeriodOpen, currentPeriod, token, periods, selectedPeriod, onSelectedPeriodChange, onItemsUpdate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  // Filter items by search term and selected period
  const filteredItems = items.filter((item) => {
    // Filter by period
    if (selectedPeriod && item.orderPeriod && item.orderPeriod._id !== selectedPeriod) {
      // Also check if orderPeriod is a string ID (for compatibility)
      if (typeof item.orderPeriod === "string" && item.orderPeriod !== selectedPeriod) {
        return false;
      }
    }

    // Filter by search term
    const search = searchTerm.toLowerCase();
    return (
      item.title?.toLowerCase().includes(search) ||
      item.author?.toLowerCase().includes(search) ||
      item.isbn?.toLowerCase().includes(search) ||
      item.publisher?.toLowerCase().includes(search)
    );
  });

  const handleDelete = (itemId) => {
    setPendingDeleteId(itemId);
    setModal({
      title: "Delete Recommendation?",
      message: "Are you sure you want to delete this recommendation?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: () => confirmDelete(itemId)
    });
  };

  const confirmDelete = async (itemId) => {
    const targetId = itemId || pendingDeleteId;
    if (!targetId) return;
    try {
      await deleteRecommendation(token, targetId);
      const newItems = items.filter((item) => item._id !== targetId);
      onItemsUpdate(newItems);
      setModal(null);
      setPendingDeleteId(null);
    } catch (error) {
      setModal({
        title: "Failed to Delete",
        message: "Failed to delete recommendation: " + (error.message || "Unknown error"),
        confirmText: "OK",
        variant: "danger"
      });
      setPendingDeleteId(null);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      title: item.title,
      author: item.author,
      isbn: item.isbn,
      publisher: item.publisher,
      edition: item.edition,
      publicationYear: item.publicationYear || "",
      binding: item.binding || "",
      agreeLatest: item.agreeLatest || "",
      price: item.price || "",
      copies: item.copies || 1,
      additionalNotes: item.additionalNotes || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (itemId) => {
    setIsLoading(true);
    try {
      const updated = await updateRecommendation(token, itemId, editForm);
      const newItems = items.map((item) => item._id === itemId ? updated : item);
      onItemsUpdate(newItems);
      handleCancelEdit();
    } catch (error) {
      setModal({
        title: "Failed to Update",
        message: "Failed to update recommendation: " + (error.message || "Unknown error"),
        confirmText: "OK",
        variant: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="large-panel">
        <div style={{ display: "flex", alignItems: "center", gap: "2.5rem", marginBottom: "1.5rem" }}>
          <h2 className="panel-title" style={{ margin: 0 }}>My Book Recommendations</h2>
          
          {/* Filters Container */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search by title, author, ISBN, or publisher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="table-input"
              style={{
                flex: 2
              }}
            />

            {/* Period Filter Dropdown */}
            {periods && (
              <select
                value={selectedPeriod || ""}
                onChange={(e) => onSelectedPeriodChange(e.target.value)}
                className="table-input"
                style={{
                  flex: 1
                }}
              >
                <option value="">All Periods</option>
                {periods.map((period) => {
                  const startDate = new Date(period.startDate).toLocaleDateString('en-GB');
                  const endDate = new Date(period.endDate).toLocaleDateString('en-GB');
                  const isOpen = period.status === "open";
                  const label = `${startDate} - ${endDate}${isOpen ? " (Active)" : ""}`;
                  return (
                    <option key={period._id} value={period._id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          /* Empty State */
          <div style={{
          borderRadius: "var(--radius)",
          padding: "3.5rem 2rem",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "0.9375rem",
          fontWeight: 500
        }}>
          {items.length === 0 ? "No Book Recommendations Found." : "No Results Found."}
        </div>
      ) : (
        /* Table */
        <div style={{
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          overflow: "hidden"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: "1100px", width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Title", "Author", "ISBN Number", "Publisher", "Edition", "Year", "Binding", "Copies", "Price (LKR)", "Status", "Rank", "Actions"].map((col) => (
                  <th key={col} style={{
                    background: "var(--surface-hover)",
                    padding: "0.875rem 1rem",
                    textAlign: "left",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap"
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <RecommendationRow 
                  key={item._id} 
                  item={item}
                  isPeriodOpen={isPeriodOpen}
                  onDelete={() => handleDelete(item._id)}
                  onEdit={() => handleOpenEdit(item)}
                  onSave={() => handleSaveEdit(item._id)}
                  onCancel={handleCancelEdit}
                  isEditing={editingId === item._id}
                  editForm={editForm}
                  onFormChange={setEditForm}
                  isLoading={isLoading}
                />
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {modal && (
        <AppModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          variant={modal.variant}
          onConfirm={modal.onConfirm || (() => setModal(null))}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

function RecommendationRow({ item, isPeriodOpen, onDelete, onEdit, onSave, onCancel, isEditing, editForm, onFormChange, isLoading }) {
  const statusMap = {
    submitted:    { bg: "var(--success-bg)", text: "var(--success-text)", border: "var(--success-border)", label: "Submitted" },
    under_review: { bg: "rgba(236, 72, 153, 0.15)", text: "#ec4899", border: "rgba(236, 72, 153, 0.3)", label: "Under Review" },
    rejected:     { bg: "var(--danger-bg)", text: "var(--danger-text)", border: "var(--danger-border)", label: "Rejected" }
  };
  const priorityMap = {
    high:       { bg: "var(--danger-bg)", text: "var(--danger-text)", border: "var(--danger-border)" },
    medium:     { bg: "var(--warning-bg)", text: "var(--warning-text)", border: "var(--warning-border)" },
    low:        { bg: "var(--success-bg)", text: "var(--success-text)", border: "var(--success-border)" },
    unassigned: { bg: "var(--surface-hover)", text: "var(--text-muted)", border: "var(--border)" }
  };

  const sc = statusMap[item.status]   ?? statusMap.submitted;
  const pc = priorityMap[item.priority] ?? priorityMap.unassigned;

  const tdStyle = {
    padding: "1rem",
    borderTop: "1px solid var(--border)",
    fontSize: "0.875rem",
    color: "var(--text)",
    verticalAlign: "middle"
  };

  function set(key, value) {
    onFormChange((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <tr style={{ transition: "background 0.15s" }}
      onMouseEnter={e => !isEditing && Array.from(e.currentTarget.cells).forEach(td => td.style.background = "var(--table-row-hover)")}
      onMouseLeave={e => !isEditing && Array.from(e.currentTarget.cells).forEach(td => td.style.background = "")}
    >
      <td style={{ ...tdStyle, fontWeight: 600, minWidth: isEditing ? 280 : 220 }}>
        {isEditing ? (
          <input
            type="text"
            value={editForm.title || ""}
            onChange={(e) => set("title", e.target.value)}
            disabled={isLoading}
            className="table-input"
          />
        ) : (
          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.title}
          </div>
        )}
      </td>
      <td style={{ ...tdStyle, minWidth: isEditing ? 200 : "auto" }}>
        {isEditing ? (
          <input
            type="text"
            value={editForm.author || ""}
            onChange={(e) => set("author", e.target.value)}
            disabled={isLoading}
            className="table-input"
          />
        ) : (
          item.author ?? "—"
        )}
      </td>
      <td style={{ ...tdStyle, whiteSpace: isEditing ? "normal" : "nowrap", minWidth: isEditing ? 180 : "auto" }}>
        {isEditing ? (
          <input
            type="text"
            value={editForm.isbn || ""}
            onChange={(e) => set("isbn", e.target.value)}
            disabled={isLoading}
            className="table-input"
          />
        ) : (
          item.isbn ?? "—"
        )}
      </td>
      <td style={{ ...tdStyle, minWidth: isEditing ? 200 : "auto" }}>
        {isEditing ? (
          <input
            type="text"
            value={editForm.publisher || ""}
            onChange={(e) => set("publisher", e.target.value)}
            disabled={isLoading}
            className="table-input"
          />
        ) : (
          item.publisher ?? "—"
        )}
      </td>
      <td style={{ ...tdStyle, minWidth: isEditing ? 140 : "auto" }}>
        {isEditing ? (
          <input
            type="text"
            value={editForm.edition || ""}
            onChange={(e) => set("edition", e.target.value)}
            disabled={isLoading}
            className="table-input"
          />
        ) : (
          item.edition ?? "—"
        )}
      </td>
      <td style={{ ...tdStyle, whiteSpace: isEditing ? "normal" : "nowrap", minWidth: isEditing ? 140 : "auto" }}>
        {isEditing ? (
          <input
            type="number"
            value={editForm.publicationYear || ""}
            onChange={(e) => set("publicationYear", e.target.value)}
            disabled={isLoading}
            className="table-input"
          />
        ) : (
          item.publicationYear ?? "—"
        )}
      </td>
      <td style={{ ...tdStyle, minWidth: isEditing ? 140 : "auto" }}>
        {isEditing ? (
          <select
            value={editForm.binding || ""}
            onChange={(e) => set("binding", e.target.value)}
            disabled={isLoading}
            className="table-input"
          >
            <option value="">Select binding</option>
            <option value="Hb">Hb</option>
            <option value="Pb">Pb</option>
            <option value="Hb/Pb">Hb/Pb</option>
          </select>
        ) : (
          item.binding ?? "—"
        )}
      </td>
      <td style={{ ...tdStyle, textAlign: "center", minWidth: isEditing ? 120 : "auto" }}>
        {isEditing ? (
          <input
            type="number"
            value={editForm.copies || 1}
            onChange={(e) => set("copies", parseInt(e.target.value) || 1)}
            disabled={isLoading}
            className="table-input"
          />
        ) : (
          item.copies ?? "—"
        )}
      </td>
      <td style={{ ...tdStyle, textAlign: "right", whiteSpace: isEditing ? "normal" : "nowrap", minWidth: isEditing ? 140 : "auto" }}>
        {isEditing ? (
          <input
            type="number"
            value={editForm.price || ""}
            onChange={(e) => set("price", e.target.value)}
            disabled={isLoading}
            className="table-input"
          />
        ) : (
          item.price ? Number(item.price).toLocaleString() : "—"
        )}
      </td>
      <td style={tdStyle}>
        <span style={{
          padding: "0.2rem 0.65rem",
          borderRadius: "2rem",
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          background: sc.bg,
          color: sc.text,
          border: `1px solid ${sc.border}`,
          whiteSpace: "nowrap"
        }}>
          {sc.label}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{
          padding: "0.2rem 0.65rem",
          borderRadius: "2rem",
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          background: item.priorityRank ? "rgba(var(--primary-rgb), 0.15)" : "var(--surface-hover)",
          color: item.priorityRank ? "var(--primary)" : "var(--text-muted)",
          border: `1px solid ${item.priorityRank ? "rgba(var(--primary-rgb), 0.3)" : "var(--border)"}`
        }}>
          {item.priorityRank ? `Rank ${item.priorityRank}` : "unassigned"}
        </span>
      </td>
      <td style={{ ...tdStyle, textAlign: "center" }}>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                disabled={isLoading}
                className="secondary-button"
              >
                <Save size={16} />
              </button>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="secondary-button"
              >
                <XIcon size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="secondary-button"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={onDelete}
                className="secondary-button"
                style={{ color: "red" }}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

import { useState } from "react";
import { Plus, Trash2, Calendar, Clock, Settings } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { Button } from "../../components/librarian/Button";
import { DataTable } from "../../components/librarian/DataTable";

const FACULTY = "Engineering Faculty";

export function OrderTimePeriodsPage() {
  const [periods, setPeriods] = useState([
    { id: 1, faculty: "Engineering Faculty", startDate: "2026-01-01", endDate: "2026-03-31", status: "active", hodRecommendationDays: 7 }
  ]);

  const [formData, setFormData] = useState({ startDate: "", endDate: "" });
  const [editingId, setEditingId] = useState(null);
  const [editEndDate, setEditEndDate] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // HOD Recommendation Period states
  const [defaultHodDays, setDefaultHodDays] = useState(7);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempHodDays, setTempHodDays] = useState(7);
  const [extendingPeriodId, setExtendingPeriodId] = useState(null);
  const [extendDays, setExtendDays] = useState("");

  const handleEditEndDate = (period) => {
    setEditingId(period.id);
    setEditEndDate(period.endDate);
  };

  const handleConfirmEditEndDate = () => {
    if (!editEndDate) {
      alert("Please select an end date");
      return;
    }

    const period = periods.find((p) => p.id === editingId);
    if (new Date(editEndDate) <= new Date(period.startDate)) {
      alert("End date must be after start date");
      return;
    }

    setPeriods(
      periods.map((p) =>
        p.id === editingId ? { ...p, endDate: editEndDate } : p
      )
    );
    setEditingId(null);
    setEditEndDate("");
  };

  const handleCancelEditEndDate = () => {
    setEditingId(null);
    setEditEndDate("");
  };

  const handleAddPeriod = () => {
    // Check if Engineering Faculty already has an active period
    const facultyExists = periods.some((p) => p.faculty === FACULTY && p.status === "active");
    if (facultyExists) {
      alert(`An active time period already exists for ${FACULTY}. Please delete it first.`);
      return;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        alert("End date must be after start date");
        return;
      }
      setPeriods([
        ...periods,
        {
          id: periods.length + 1,
          faculty: FACULTY,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: "active"
        }
      ]);
      setFormData({ startDate: "", endDate: "" });
    } else {
      alert("Please fill in all fields");
    }
  };

  const facultyHasActivePeriod = periods.some((p) => p.faculty === FACULTY && p.status === "active");

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    setPeriods(periods.filter((p) => p.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // HOD Recommendation Period Handlers
  const calculateHodRecommendationDeadline = (endDate, days) => {
    const deadline = new Date(endDate);
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  };

  const handleSaveDefaultHodDays = () => {
    setDefaultHodDays(tempHodDays);
    // Update all active periods to use new default
    setPeriods(
      periods.map((p) =>
        p.status === "active" ? { ...p, hodRecommendationDays: tempHodDays } : p
      )
    );
    setShowSettingsModal(false);
  };

  const handleExtendHodDeadline = (periodId) => {
    setExtendingPeriodId(periodId);
    setExtendDays("");
  };

  const handleConfirmExtension = () => {
    if (!extendDays || extendDays <= 0) {
      alert("Please enter a valid number of days");
      return;
    }

    setPeriods(
      periods.map((p) =>
        p.id === extendingPeriodId
          ? { ...p, hodRecommendationDays: p.hodRecommendationDays + parseInt(extendDays) }
          : p
      )
    );
    setExtendingPeriodId(null);
    setExtendDays("");
    alert(`HOD recommendation period extended by ${extendDays} days!`);
  };

  return (
    <div className="order-periods-page">
      <div className="page-header">
        <div>
          <h1>Order Time Periods</h1>
          <p>Manage book recommendation ordering periods for Engineering Faculty</p>
        </div>
        <button
          onClick={() => {
            setTempHodDays(defaultHodDays);
            setShowSettingsModal(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "500"
          }}
        >
          <Settings size={18} /> HOD Period Settings
        </button>
      </div>

      <Card title="Add New Period" className="form-card">
        <div className="form-group">
          <div className="form-row">
            <div className="form-field">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-field">
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="form-input"
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <Button 
            onClick={handleAddPeriod} 
            variant="primary"
            disabled={facultyHasActivePeriod}
            style={{ opacity: facultyHasActivePeriod ? 0.6 : 1, cursor: facultyHasActivePeriod ? "not-allowed" : "pointer" }}
          >
            <Plus size={18} /> {facultyHasActivePeriod ? "Period Already Exists" : "Add Period"}
          </Button>
          {facultyHasActivePeriod && (
            <p style={{ color: "#d32f2f", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              ⚠️ An active time period already exists for {FACULTY}
            </p>
          )}
        </div>
      </Card>

      <Card title="Active Periods" className="full-width">
        <DataTable
          columns={[
            { key: "id", label: "ID", width: "8%" },
            { key: "startDate", label: "Start Date", width: "18%" },
            { key: "endDate", label: "End Date", width: "18%" },
            { key: "hodDeadline", label: "HOD Deadline", width: "20%" },
            { key: "status", label: "Status", width: "10%" },
            { key: "actions", label: "Actions", width: "26%" }
          ]}
          data={periods}
          renderRow={(period) => {
            const hodDeadlineDate = calculateHodRecommendationDeadline(period.endDate, period.hodRecommendationDays || defaultHodDays);
            const today = new Date();
            const daysUntilDeadline = Math.ceil((hodDeadlineDate - today) / (1000 * 60 * 60 * 24));
            const isApproaching = daysUntilDeadline <= 3 && daysUntilDeadline > 0;
            const isExpired = daysUntilDeadline <= 0;

            return (
              <>
                <td>#{period.id}</td>
                <td>{new Date(period.startDate).toLocaleDateString()}</td>
                <td>{new Date(period.endDate).toLocaleDateString()}</td>
                <td>
                  <span style={{
                    color: isExpired ? "#d32f2f" : isApproaching ? "#ff6f00" : "#2e7d32",
                    fontWeight: isApproaching || isExpired ? "bold" : "normal"
                  }}>
                    {hodDeadlineDate.toLocaleDateString()}
                    {isApproaching && " ⏰"}
                    {isExpired && " ⏱️"}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${period.status === "active" ? "success" : "secondary"}`}>
                    {period.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons" style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                    <button
                      className="btn-icon"
                      onClick={() => handleEditEndDate(period)}
                      title="Edit End Date"
                    >
                      <Calendar size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleExtendHodDeadline(period.id)}
                      title="Extend HOD Period"
                    >
                      <Clock size={16} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDeleteClick(period.id)}
                    >
                      <Trash2 size={16} title="Delete" />
                    </button>
                  </div>
                </td>
              </>
            );
          }}
        />
      </Card>

      {editingId && (
        <div className="modal-overlay" onClick={handleCancelEditEndDate}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit End Date</h2>
            {(() => {
              const period = periods.find((p) => p.id === editingId);
              return (
                <div className="modal-body">
                  <p style={{ marginBottom: "1rem" }}>
                    <strong>{period.faculty}</strong>
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
                    Start Date: {new Date(period.startDate).toLocaleDateString()}
                    <br />
                    Current End Date: {new Date(period.endDate).toLocaleDateString()}
                  </p>
                  <div className="form-field">
                    <label>New End Date</label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="form-input"
                      min={period.startDate}
                    />
                  </div>
                  <div className="modal-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                    <Button onClick={handleConfirmEditEndDate} variant="primary">
                      Confirm
                    </Button>
                    <Button onClick={handleCancelEditEndDate} variant="secondary">
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Period</h2>
            {(() => {
              const period = periods.find((p) => p.id === deleteConfirmId);
              return (
                <div className="modal-body">
                  <p style={{ marginBottom: "1.5rem", color: "#333" }}>
                    Are you sure you want to delete the time period for <strong>{period.faculty}</strong>?
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
                    Period: {new Date(period.startDate).toLocaleDateString()} to {new Date(period.endDate).toLocaleDateString()}
                  </p>
                  <div className="modal-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                    <Button onClick={handleConfirmDelete} variant="primary" style={{ background: "#ef4444" }}>
                      Delete
                    </Button>
                    <Button onClick={handleCancelDelete} variant="secondary">
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>HOD Recommendation Period Settings</h2>
            <div className="modal-body">
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ marginBottom: "1rem", color: "#666" }}>
                  Set the default number of days HODs have to recommend books after the order period closes.
                </p>
                <div className="form-field">
                  <label>Default Days for HOD Recommendations</label>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input
                      type="number"
                      value={tempHodDays}
                      onChange={(e) => setTempHodDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="form-input"
                      style={{ maxWidth: "120px" }}
                      min="1"
                      max="365"
                    />
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>days</span>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: "#e3f2fd",
                padding: "1rem",
                borderRadius: "4px",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
                color: "#1565c0"
              }}>
                <strong>ℹ️ Note:</strong> This will update the default for all active periods. Individual periods can still be extended separately.
              </div>

              <div className="modal-actions" style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <Button onClick={handleSaveDefaultHodDays} variant="primary">
                  Save Settings
                </Button>
                <Button onClick={() => setShowSettingsModal(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {extendingPeriodId && (
        <div className="modal-overlay" onClick={() => setExtendingPeriodId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Extend HOD Recommendation Period</h2>
            {(() => {
              const period = periods.find((p) => p.id === extendingPeriodId);
              if (!period) return null;
              
              const currentDeadline = calculateHodRecommendationDeadline(period.endDate, period.hodRecommendationDays || defaultHodDays);
              const newDeadline = new Date(currentDeadline);
              newDeadline.setDate(newDeadline.getDate() + (parseInt(extendDays) || 0));

              return (
                <div className="modal-body">
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>Faculty:</strong> {period.faculty}
                  </p>
                  <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "#666" }}>
                    Current Deadline: <strong>{currentDeadline.toLocaleDateString()}</strong>
                  </p>

                  <div className="form-field">
                    <label>Days to Add</label>
                    <input
                      type="number"
                      value={extendDays}
                      onChange={(e) => setExtendDays(e.target.value)}
                      className="form-input"
                      min="1"
                      placeholder="Enter number of days"
                    />
                  </div>

                  {extendDays && (
                    <p style={{
                      marginBottom: "1.5rem",
                      padding: "0.75rem",
                      backgroundColor: "#e8f5e9",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                      color: "#2e7d32"
                    }}>
                      <strong>New Deadline:</strong> {newDeadline.toLocaleDateString()}
                    </p>
                  )}

                  <div className="modal-actions" style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                    <Button onClick={handleConfirmExtension} variant="primary">
                      Extend Period
                    </Button>
                    <Button onClick={() => setExtendingPeriodId(null)} variant="secondary">
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

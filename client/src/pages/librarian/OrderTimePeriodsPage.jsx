import { useState, useEffect } from "react";
import { Calendar, Pencil, Play, Plus, Settings, Trash2, XCircle } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { Button } from "../../components/librarian/Button";
import { DataTable } from "../../components/librarian/DataTable";
import { AppModal } from "../../components/AppModal";
import {
  fetchOrderPeriods,
  createOrderPeriod,
  updateOrderPeriod,
  closeOrderPeriod,
  openHodPeriod,
  deleteOrderPeriod
} from "../../api";

const FACULTY = "Engineering Faculty";

export function OrderTimePeriodsPage({ token, onViewChange, onSelectPeriod }) {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({ startDate: "", endDate: "" });
  const [editingId, setEditingId] = useState(null);
  const [editEndDate, setEditEndDate] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // HOD Recommendation Period states
  const [defaultHodDays, setDefaultHodDays] = useState(7);
  const [defaultHodEndDate, setDefaultHodEndDate] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempHodDays, setTempHodDays] = useState(7);
  const [tempHodEndDate, setTempHodEndDate] = useState("");
  const [extendingPeriodId, setExtendingPeriodId] = useState(null);
  const [extendDays, setExtendDays] = useState("");
  const [modal, setModal] = useState(null);

  const showNotice = (title, message, variant = "default") => {
    setModal({ title, message, confirmText: "OK", variant, onConfirm: () => setModal(null) });
  };

  const showConfirm = ({ title, message, confirmText = "Confirm", variant = "default", onConfirm }) => {
    setModal({
      title,
      message,
      confirmText,
      cancelText: "Cancel",
      variant,
      onConfirm: async () => {
        setModal(null);
        await onConfirm();
      },
      onCancel: () => setModal(null)
    });
  };

  const loadPeriods = () => {
    setLoading(true);
    fetchOrderPeriods(token)
      .then(setPeriods)
      .catch((err) => showNotice("Failed to Load Periods", err.message || "Failed to load periods", "danger"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPeriods();
  }, [token]);

  const handleEditEndDate = (period) => {
    setEditingId(period._id);
    setEditEndDate(period.endDate ? period.endDate.split("T")[0] : "");
  };

  const handleConfirmEditEndDate = async () => {
    if (!editEndDate) {
      showNotice("Missing End Date", "Please select an end date");
      return;
    }

    const period = periods.find((p) => p._id === editingId);
    if (new Date(editEndDate) <= new Date(period.startDate)) {
      showNotice("Invalid Date Range", "End date must be after start date");
      return;
    }

    try {
      await updateOrderPeriod(token, editingId, {
        endDate: editEndDate,
        hodRecommendationDays: period.hodRecommendationDays
      });
      setEditingId(null);
      setEditEndDate("");
      loadPeriods();
    } catch (err) {
      showNotice("Failed to Update End Date", err.message || "Failed to update end date", "danger");
    }
  };

  const handleCancelEditEndDate = () => {
    setEditingId(null);
    setEditEndDate("");
  };

  const handleAddPeriod = async () => {
    const facultyExists = periods.some((p) => p.faculty === FACULTY && (p.status === "open" || p.status === "hod_priority"));
    if (facultyExists) {
      showNotice("Active Period Exists", `An active time period already exists for ${FACULTY}. Please close or delete it first.`);
      return;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        showNotice("Invalid Date Range", "End date must be after start date");
        return;
      }
      try {
        await createOrderPeriod(token, {
          faculty: FACULTY,
          startDate: formData.startDate,
          endDate: formData.endDate,
          hodRecommendationDays: defaultHodDays
        });
        setFormData({ startDate: "", endDate: "" });
        loadPeriods();
      } catch (err) {
        showNotice("Failed to Add Period", err.message || "Failed to add period", "danger");
      }
    } else {
      showNotice("Missing Dates", "Please fill in all fields");
    }
  };

  const facultyHasActivePeriod = periods.some((p) => p.faculty === FACULTY && (p.status === "open" || p.status === "hod_priority"));

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteOrderPeriod(token, deleteConfirmId);
      setDeleteConfirmId(null);
      loadPeriods();
    } catch (err) {
      showNotice("Failed to Delete Period", err.message || "Failed to delete period", "danger");
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const calculateHodRecommendationDeadline = (endDate, days) => {
    const deadline = new Date(endDate);
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  };

  const handleSaveDefaultHodDays = async () => {
    setDefaultHodDays(tempHodDays);
    setDefaultHodEndDate(tempHodEndDate);
    
    // Update the current period if it exists
    const currentPeriod = periods.find((p) => p.status === "open" || p.status === "hod_priority");
    if (currentPeriod) {
      try {
        const updateData = {
          endDate: currentPeriod.endDate,
          hodRecommendationDays: tempHodDays
        };
        
        // If a specific HOD end date is set, use that directly and calculate days
        if (tempHodEndDate) {
          const lecturerEndDate = new Date(currentPeriod.endDate);
          const hodEndDate = new Date(tempHodEndDate);
          const days = Math.ceil((hodEndDate - lecturerEndDate) / (1000 * 60 * 60 * 24));
          updateData.hodRecommendationDays = Math.max(1, days);
        } else {
          // Otherwise use the default days
          updateData.hodRecommendationDays = tempHodDays;
        }
        
        await updateOrderPeriod(token, currentPeriod._id, updateData);
        loadPeriods();
        showNotice("Settings Updated", "HOD period settings and current period have been updated.");
      } catch (err) {
        showNotice("Failed to Update Period", err.message || "Failed to update period", "danger");
      }
    }
    
    setShowSettingsModal(false);
  };

  const handleExtendHodDeadline = (periodId) => {
    setExtendingPeriodId(periodId);
    setExtendDays("");
  };

  const handleConfirmExtension = async () => {
    if (!extendDays || extendDays <= 0) {
      showNotice("Invalid Extension", "Please enter a valid number of days");
      return;
    }

    const period = periods.find((p) => p._id === extendingPeriodId);
    const newDays = (period.hodRecommendationDays || 7) + parseInt(extendDays);

    try {
      await updateOrderPeriod(token, extendingPeriodId, {
        startDate: period.startDate,
        endDate: period.endDate,
        hodRecommendationDays: newDays
      });
      setExtendingPeriodId(null);
      setExtendDays("");
      loadPeriods();
      showNotice("HOD Period Extended", `HOD recommendation period extended to ${newDays} days.`);
    } catch (err) {
      showNotice("Failed to Extend HOD Period", err.message || "Failed to extend HOD period", "danger");
    }
  };

  const handleOpenHod = async (id) => {
    showConfirm({
      title: "Open HOD Priority Phase?",
      message: "Lecturer submissions will close and HoDs will be able to rank their department lists.",
      confirmText: "Open HOD Phase",
      onConfirm: async () => {
        try {
          await openHodPeriod(token, id);
          loadPeriods();
        } catch (err) {
          showNotice("Failed to Open HOD Phase", err.message || "Failed to open HOD phase", "danger");
        }
      }
    });
  };

  const handleClosePeriod = async (id) => {
    showConfirm({
      title: "Close Order Period?",
      message: "Any active HoD lists will be sent to the librarian before the period is closed.",
      confirmText: "Close Period",
      variant: "danger",
      onConfirm: async () => {
        try {
          await closeOrderPeriod(token, id);
          loadPeriods();
        } catch (err) {
          showNotice("Failed to Close Period", err.message || "Failed to close period", "danger");
        }
      }
    });
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      <section className="large-panel">
        <h3 className="panel-title">Add New Period</h3>
        <Card className="form-card" style={{ padding: "1rem" }}>
          <div className="form-group" style={{ gap: "0.75rem" }}>
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
              <p style={{color: "var(--danger-text)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                ⚠️ An active time period already exists.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="large-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Order Periods</h3>
          <Button
            onClick={() => {
              setTempHodDays(defaultHodDays);
              setTempHodEndDate(defaultHodEndDate);
              setShowSettingsModal(true);
            }}
            variant="primary"
          >
            <Settings size={18} /> HoD Period Settings
          </Button>
        </div>
        <Card className="full-width" style={{ marginTop: "1rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>Loading periods...</div>
          ) : (
            <DataTable
              columns={[
                { key: "startDate", label: "Start Date", width: "20%" },
                { key: "endDate", label: "End Date", width: "20%" },
                { key: "hodDeadline", label: "HOD Deadline", width: "20%" },
                { key: "status", label: "Status", width: "20%" },
                { key: "actions", label: "Actions", width: "2%" }
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
                    <td>{new Date(period.startDate).toLocaleDateString('en-GB')}</td>
                    <td>{new Date(period.endDate).toLocaleDateString('en-GB')}</td>
                    <td>
                      <span style={{
                        color: isExpired ? "var(--danger-text)" : isApproaching ? "var(--warning-text)" : "var(--success-text)",
                        fontWeight: isApproaching || isExpired ? "bold" : "normal"
                      }}>
                        {hodDeadlineDate.toLocaleDateString('en-GB')}
                        {isApproaching && " ⏰"}
                        {isExpired && " ⏱️"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        period.status === "open"
                          ? "badge-success"
                          : period.status === "hod_priority"
                          ? "badge-info"
                          : period.status === "draft"
                          ? "badge-warning"
                          : "badge-default"
                      }`}>
                        {period.status === "open"
                          ? "Open for lecturers"
                          : period.status === "hod_priority"
                          ? "HOD Priority Open"
                          : period.status === "draft"
                          ? "Draft"
                          : "Closed"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                        {(period.status === "draft" || period.status === "open") && (
                          <button
                            className="btn-icon"
                            onClick={() => handleEditEndDate(period)}
                            title="Edit End Date"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {period.status === "open" && (
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenHod(period._id)}
                            title="Open HOD Priority Phase"
                            style={{ color: "var(--info)", borderColor: "var(--info)" }}
                          >
                            <Play size={16} />
                          </button>
                        )}
                        {(period.status === "open" || period.status === "hod_priority") && (
                          <button
                            className="btn-icon danger"
                            onClick={() => handleClosePeriod(period._id)}
                            title="Close Period"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        {(period.status === "draft" || period.status === "closed") && (
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDeleteClick(period._id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                );
              }}
            />
          )}
        </Card>
      </section>

      {/* Edit End Date Modal */}
      {editingId && (() => {
        const period = periods.find((p) => p._id === editingId);
        return (
          <AppModal title="Edit End Date" confirmText="Save" cancelText="Cancel" onConfirm={handleConfirmEditEndDate} onCancel={handleCancelEditEndDate}>
            <div className="modal-form-body">
              <p className="text-muted" style={{ marginBottom: "1.25rem" }}>
                Start Date: {new Date(period.startDate).toLocaleDateString('en-GB')}<br />
                Current End Date: {new Date(period.endDate).toLocaleDateString('en-GB')}
              </p >
              <div
                style={{
                  marginBottom: "0.5rem",
                  color: "var(--text)",
                  textAlign: "left",
                }}
              >
                New End Date :
              </div>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="form-input"
                min={period.startDate ? period.startDate.split("T")[0] : ""}
                style={{ marginBottom: "1.5rem" }}
              />
            </div>
          </AppModal>
        );
      })()}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (() => {
        const period = periods.find((p) => p._id === deleteConfirmId);
        return (
          <AppModal
            title="Delete Period"
            message={`Delete the time period for ${period.faculty}? Period: ${new Date(period.startDate).toLocaleDateString('en-GB')} to ${new Date(period.endDate).toLocaleDateString('en-GB')}.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        );
      })()}

      {/* HOD Period Settings Modal */}
      {showSettingsModal && (() => {
        const currentPeriod = periods.find((p) => p.status === "open" || p.status === "hod_priority");
        return (
        <AppModal
          title="HoD Recommendation Period Settings"
          confirmText="Save"
          cancelText="Cancel"
          onConfirm={handleSaveDefaultHodDays}
          onCancel={() => setShowSettingsModal(false)}
          
        >
          <div className="modal-form-body" style={{ marginBottom: "0rem" }}>
            <p className="text-muted" style={{ marginTop: "2rem", marginBottom: "1rem", textAlign: "left"}}>
              Set the default number of days HoDs have to prioritize books after the submission period closes.
            </p>

            <div className="form-field" style={{ marginBottom: "1.25rem", textAlign: "left" }}>
              <label>Default Days for HoD Prioritization</label>
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
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>days</span>
              </div>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "left" }}>
                A specific HOD end date takes priority. If set, it will be used directly. If not set, the default number of days will be applied to the current period and all future periods.
              </p>
            <div className="form-field" style={{ marginBottom: "1rem", textAlign: "left" }}>
              <label>End Date for HOD Period</label>
              <input
                type="date"
                value={tempHodEndDate}
                onChange={(e) => setTempHodEndDate(e.target.value)}
                className="form-input"
                min={currentPeriod && currentPeriod.endDate ? currentPeriod.endDate.split("T")[0] : ""}
              />
              {tempHodEndDate && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  New date: {new Date(tempHodEndDate).toLocaleDateString('en-GB')}
                </p>
              )}
            </div>

            <div style={{
              background: "rgba(var(--primary-rgb), 0.08)",
              border: "1px solid rgba(var(--primary-rgb), 0.2)",
              padding: "0.875rem",
              borderRadius: "var(--radius)",
              fontSize: "0.875rem",
              color: "var(--primary)",
              marginBottom: "2.5rem",
            }}>             
            <strong>ℹ️ Note:</strong> Specific HOD end date has priority. If set, it overrides the default days for the current period. If not set, the default days apply to all periods.
            </div>
          </div>
        </AppModal>
        );
      })()}

      {/* Extend HOD Period Modal */}
      {extendingPeriodId && (() => {
        const period = periods.find((p) => p._id === extendingPeriodId);
        if (!period) return null;

        const currentDeadline = calculateHodRecommendationDeadline(period.endDate, period.hodRecommendationDays || defaultHodDays);
        const newDeadline = new Date(currentDeadline);
        newDeadline.setDate(newDeadline.getDate() + (parseInt(extendDays) || 0));

        return (
          <AppModal
            title="Extend HOD Recommendation Period"
            confirmText="Extend Period"
            cancelText="Cancel"
            onConfirm={handleConfirmExtension}
            onCancel={() => setExtendingPeriodId(null)}
          >
            <div className="modal-form-body">
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Faculty:</strong> {period.faculty}
              </p>
              <p style={{ marginBottom: "1.25rem" }} className="text-muted">
                Current Deadline: <strong>{currentDeadline.toLocaleDateString('en-GB')}</strong>
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
                <div style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  background: "var(--success-bg)",
                  border: "1px solid var(--success-border)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.875rem",
                  color: "var(--success-text)"
                }}>
                  <strong>New Deadline:</strong> {newDeadline.toLocaleDateString('en-GB')}
                </div>
              )}
            </div>
          </AppModal>
        );
      })()}

      {/* Notice / Confirm Modal (used by showNotice and showConfirm) */}
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
    </section>
  );
}

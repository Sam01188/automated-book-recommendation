import { useState } from "react";
import { Plus, Trash2, Mail, Calendar } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { Button } from "../../components/librarian/Button";
import { DataTable } from "../../components/librarian/DataTable";

const FACULTIES = [
  "Engineering Faculty",
  "Human Resource Faculty",
  "Science Faculty",
  "Management Faculty",
  "Medicine Faculty"
];

export function OrderTimePeriodsPage({ onViewChange, onSelectPeriod }) {
  const [periods, setPeriods] = useState([
    { id: 1, faculty: "Engineering Faculty", startDate: "2026-01-01", endDate: "2026-03-31", status: "active" },
    { id: 2, faculty: "Science Faculty", startDate: "2025-10-01", endDate: "2025-12-31", status: "closed" }
  ]);

  const [formData, setFormData] = useState({ faculty: "", startDate: "", endDate: "" });
  const [editingId, setEditingId] = useState(null);
  const [editEndDate, setEditEndDate] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
    if (!formData.faculty) {
      alert("Please select a faculty");
      return;
    }

    // Check if faculty already has an active period
    const facultyExists = periods.some((p) => p.faculty === formData.faculty && p.status === "active");
    if (facultyExists) {
      alert(`An active time period already exists for ${formData.faculty}. Please delete it first or select a different faculty.`);
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
          faculty: formData.faculty,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: "active"
        }
      ]);
      setFormData({ faculty: "", startDate: "", endDate: "" });
    } else {
      alert("Please fill in all fields");
    }
  };

  const isFacultySelected = formData.faculty !== "";
  const facultyHasActivePeriod = periods.some((p) => p.faculty === formData.faculty && p.status === "active");

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

  const handleSendEmail = (period) => {
    if (onSelectPeriod) {
      onSelectPeriod(period);
    }
    if (onViewChange) {
      onViewChange("announcements");
    }
  };

  return (
    <div className="order-periods-page">
      <div className="page-header">
        <div>
          <h1>Order Time Periods</h1>
          <p>Manage book recommendation ordering periods by faculty</p>
        </div>
      </div>

      <Card title="Add New Period" className="form-card">
        <div className="form-group">
          <div className="form-row">
            <div className="form-field">
              <label>Faculty</label>
              <select
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                className="form-input"
              >
                <option value="">-- Select Faculty --</option>
                {FACULTIES.map((faculty) => (
                  <option key={faculty} value={faculty}>
                    {faculty}
                  </option>
                ))}
              </select>
            </div>
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
            disabled={!isFacultySelected || facultyHasActivePeriod}
            style={{ opacity: (!isFacultySelected || facultyHasActivePeriod) ? 0.6 : 1, cursor: (!isFacultySelected || facultyHasActivePeriod) ? "not-allowed" : "pointer" }}
          >
            <Plus size={18} /> {facultyHasActivePeriod ? "Period Already Exists" : "Add Period"}
          </Button>
          {facultyHasActivePeriod && (
            <p style={{ color: "#d32f2f", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              ⚠️ An active time period already exists for {formData.faculty}
            </p>
          )}
        </div>
      </Card>

      <Card title="Active Periods" className="full-width">
        <DataTable
          columns={[
            { key: "id", label: "ID", width: "8%" },
            { key: "faculty", label: "Faculty", width: "25%" },
            { key: "startDate", label: "Start Date", width: "20%" },
            { key: "endDate", label: "End Date", width: "20%" },
            { key: "status", label: "Status", width: "12%" },
            { key: "actions", label: "Actions", width: "15%" }
          ]}
          data={periods}
          renderRow={(period) => (
            <>
              <td>#{period.id}</td>
              <td><strong>{period.faculty}</strong></td>
              <td>{new Date(period.startDate).toLocaleDateString()}</td>
              <td>{new Date(period.endDate).toLocaleDateString()}</td>
              <td>
                <span className={`badge badge-${period.status === "active" ? "success" : "secondary"}`}>
                  {period.status}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-icon"
                    onClick={() => handleEditEndDate(period)}
                    title="Edit End Date"
                  >
                    <Calendar size={16} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleSendEmail(period)}
                    title="Send Email"
                  >
                    <Mail size={16} />
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
          )}
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
    </div>
  );
}

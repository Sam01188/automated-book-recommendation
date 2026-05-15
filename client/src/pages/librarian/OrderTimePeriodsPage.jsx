import { useState } from "react";
import { Plus, Trash2, Mail } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { Button } from "../../components/librarian/Button";
import { DataTable } from "../../components/librarian/DataTable";

export function OrderTimePeriodsPage() {
  const [periods, setPeriods] = useState([
    { id: 1, startDate: "2026-01-01", endDate: "2026-03-31", status: "active" },
    { id: 2, startDate: "2025-10-01", endDate: "2025-12-31", status: "closed" }
  ]);

  const [formData, setFormData] = useState({ startDate: "", endDate: "" });

  const handleAddPeriod = () => {
    if (formData.startDate && formData.endDate) {
      setPeriods([
        ...periods,
        {
          id: periods.length + 1,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: "active"
        }
      ]);
      setFormData({ startDate: "", endDate: "" });
    }
  };

  const handleDeletePeriod = (id) => {
    setPeriods(periods.filter((p) => p.id !== id));
  };

  return (
    <div className="order-periods-page">
      <div className="page-header">
        <div>
          <h1>Order Time Periods</h1>
          <p>Manage book recommendation ordering periods</p>
        </div>
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
              />
            </div>
            <div className="form-field">
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <Button onClick={handleAddPeriod} variant="primary">
            <Plus size={18} /> Add Period
          </Button>
        </div>
      </Card>

      <Card title="Active Periods" className="full-width">
        <DataTable
          columns={[
            { key: "id", label: "ID", width: "10%" },
            { key: "startDate", label: "Start Date", width: "25%" },
            { key: "endDate", label: "End Date", width: "25%" },
            { key: "status", label: "Status", width: "15%" },
            { key: "actions", label: "Actions", width: "25%" }
          ]}
          data={periods}
          renderRow={(period) => (
            <>
              <td>#{period.id}</td>
              <td>{new Date(period.startDate).toLocaleDateString()}</td>
              <td>{new Date(period.endDate).toLocaleDateString()}</td>
              <td>
                <span className={`badge badge-${period.status === "active" ? "success" : "secondary"}`}>
                  {period.status}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button className="btn-icon">
                    <Mail size={16} title="Send Email" />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDeletePeriod(period.id)}
                  >
                    <Trash2 size={16} title="Delete" />
                  </button>
                </div>
              </td>
            </>
          )}
        />
      </Card>
    </div>
  );
}

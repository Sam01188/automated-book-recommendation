import { Download, Table } from "lucide-react";
import { Card } from "../../components/librarian/Card";

export function ExportDataPage({ items }) {
  function downloadExcel() {
    const header = "Title,Author,Publisher,Submitted By,Priority,Status,Department";
    const rows = items.map((item) =>
      [
        item.title,
        item.author,
        item.publisher,
        item.submittedBy?.name || "",
        item.priority,
        item.status,
        item.department
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recommendations-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="export-page">
      <div className="page-header">
        <div>
          <h1>Export Data</h1>
          <p>Download recommendation data as a CSV file</p>
        </div>
      </div>

      <div className="export-grid">
        <Card className="export-card" onClick={downloadExcel}>
          <div className="export-icon excel">
            <Table size={32} />
          </div>
          <h3>Export to Excel</h3>
          <p>Download all recommendations as a CSV file compatible with Excel and spreadsheet applications.</p>
          <button className="btn btn-primary btn-sm" onClick={downloadExcel}>
            <Download size={16} /> Download Excel
          </button>
        </Card>
      </div>

      <Card title="Export Information" className="info-card">
        <div className="info-content">
          <p>
            <strong>Total Records:</strong> {items.length} recommendations
          </p>
          <p>
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>
          <p>
            <strong>Included Fields:</strong> Title, Author, Publisher, Submitted By, Priority, Status, Department
          </p>
        </div>
      </Card>
    </div>
  );
}

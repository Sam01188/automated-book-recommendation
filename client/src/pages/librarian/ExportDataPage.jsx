import { Download, FileText, Table } from "lucide-react";
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

  function downloadPDF() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recommendations-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadClick(event, download) {
    event.stopPropagation();
    download();
  }

  return (
    <div className="dashboard-container">
      <section className="large-panel">
        <h3 className="panel-title">Export Data</h3>
        <div className="export-grid">
          <Card className="export-card" onClick={downloadExcel}>
            <div className="export-icon excel">
              <Table size={32} />
            </div>
            <h3>Export as Excel</h3>
            <p>Download all recommendations as a CSV file compatible with Excel and spreadsheet applications.</p>
            <button className="btn btn-primary btn-sm" onClick={(event) => handleDownloadClick(event, downloadExcel)}>
              <Download size={16} /> Download Excel
            </button>
          </Card>

          <Card className="export-card" onClick={downloadPDF}>
            <div className="export-icon pdf">
              <FileText size={32} />
            </div>
            <h3>Export as PDF</h3>
            <p>Generate a detailed PDF report with all recommendation data formatted for printing and archival.</p>
            <button className="btn btn-secondary btn-sm" onClick={(event) => handleDownloadClick(event, downloadPDF)}>
              <Download size={16} /> Download PDF
            </button>
          </Card>
        </div>
      </section>

      <section className="large-panel">
        <h3 className="panel-title">Export Information</h3>
        <Card className="info-card">
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
      </section>
    </div>
  );
}

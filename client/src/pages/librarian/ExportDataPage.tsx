import { Download } from "lucide-react";
import type { Recommendation } from "../../types";

export function ExportDataPage({ items }: { items: Recommendation[] }) {
  function downloadCsv() {
    const header = "Title,Author,Publisher,Submitted By,Priority,Status";
    const rows = items.map((item) =>
      [item.title, item.author, item.publisher, item.submittedBy?.name || "", item.priority, item.status]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "recommendations.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdfData() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "recommendations-report-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="export-grid">
      <button className="export-card" type="button" onClick={downloadCsv}>
        <Download size={28} />
        <strong>Export to Excel</strong>
        <span>Download recommendations as a CSV file compatible with Excel.</span>
        <span className="success-button">Download Excel File</span>
      </button>
      <button className="export-card" type="button" onClick={downloadPdfData}>
        <Download size={28} />
        <strong>Export to PDF</strong>
        <span>Prepare formatted recommendation data for PDF reporting.</span>
        <span className="danger-button">Download PDF File</span>
      </button>
    </div>
  );
}

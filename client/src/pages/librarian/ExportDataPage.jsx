import { Download, Table } from "lucide-react";
import { Card } from "../../components/librarian/Card";

function getOrderedItems(items) {
  return [...items].sort((a, b) => {
    const departmentCompare = (a.department || "").localeCompare(b.department || "");
    if (departmentCompare !== 0) return departmentCompare;
    return (a.priorityRank || 9999) - (b.priorityRank || 9999);
  });
}

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function escapePdfText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimplePdf(lines) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const lineHeight = 14;
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
  const pages = [];

  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pages.push(lines.slice(i, i + maxLinesPerPage));
  }

  const objects = [];
  const catalogId = 1;
  const pagesId = 2;
  let nextId = 3;
  const pageIds = [];
  const contentIds = [];

  pages.forEach((pageLines) => {
    const pageId = nextId++;
    const contentId = nextId++;
    pageIds.push(pageId);
    contentIds.push(contentId);

    const text = [
      "BT",
      "/F1 10 Tf",
      `${margin} ${pageHeight - margin} Td`,
      ...pageLines.flatMap((line, index) => [
        index === 0 ? "" : `0 -${lineHeight} Td`,
        `(${escapePdfText(line).slice(0, 95)}) Tj`
      ]).filter(Boolean),
      "ET"
    ].join("\n");

    objects[contentId] = `<< /Length ${text.length} >>\nstream\n${text}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentId} 0 R >>`;
  });

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < nextId; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${nextId}\n0000000000 65535 f \n`;
  for (let id = 1; id < nextId; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${nextId} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function ExportDataPage({ items }) {
  const orderedItems = getOrderedItems(items);

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadExcel() {
    const header = "Department,Rank,Title,Author,ISBN,Publisher,Publisher Place,Edition,Binding,Agree Latest/Cheapest,Publication Year,No. of Pages,Submitted By,Status,Copies,Price,Additional Notes";
    const rows = orderedItems.map((item) =>
      [
        item.department,
        item.priorityRank,
        item.title,
        item.author,
        item.isbn,
        item.publisher,
        item.publisherPlace || "",
        item.edition,
        item.binding || "",
        item.agreeLatest || "",
        item.publicationYear || "",
        item.numberOfPages || "",
        item.submittedBy?.name || "",
        item.status,
        item.copies,
        item.price ? `${item.currency || "LKR"} ${item.price}` : "",
        item.additionalNotes || ""
      ].map(escapeCsv).join(",")
    );
    downloadBlob(
      new Blob([[header, ...rows].join("\n")], { type: "text/csv" }),
      `recommendations-${new Date().toISOString().split("T")[0]}.csv`
    );
  }

  function downloadPdf() {
    const lines = [
      "HoD Submitted Recommendation Lists",
      `Generated: ${new Date().toLocaleString()}`,
      ""
    ];
    let currentDepartment = "";

    orderedItems.forEach((item) => {
      if (item.department !== currentDepartment) {
        currentDepartment = item.department || "Unassigned";
        lines.push("", `--- Department: ${currentDepartment} ---`);
      }
      lines.push(`Rank: ${item.priorityRank || "-"}`);
      lines.push(`Title: ${item.title}`);
      lines.push(`Author: ${item.author}`);
      lines.push(`ISBN: ${item.isbn || "N/A"}`);
      lines.push(`Publisher: ${item.publisher} (${item.publisherPlace || "N/A"})`);
      lines.push(`Edition: ${item.edition}`);
      lines.push(`Binding: ${item.binding || "N/A"} | Agree Latest: ${item.agreeLatest || "N/A"}`);
      lines.push(`Year: ${item.publicationYear || "N/A"} | Pages: ${item.numberOfPages || "N/A"}`);
      lines.push(`Copies: ${item.copies} | Price: ${item.price ? `${item.currency || "LKR"} ${item.price}` : "N/A"}`);
      lines.push(`Submitted By: ${item.submittedBy?.name || "N/A"} | Status: ${item.status}`);
      if (item.additionalNotes) {
        lines.push(`Notes: ${item.additionalNotes}`);
      }
      lines.push("--------------------------------------------------------------------------------");
    });

    downloadBlob(buildSimplePdf(lines), `recommendations-${new Date().toISOString().split("T")[0]}.pdf`);
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
          <Card className="export-card">
            <div className="export-icon excel">
              <Table size={32} />
            </div>
            <h3>Export as Excel</h3>
            <p>Download ranked HoD lists as a CSV file compatible with Excel and spreadsheet applications.</p>
            <button className="btn btn-primary btn-sm" onClick={(event) => handleDownloadClick(event, downloadExcel)}>
              <Download size={16} /> Download Excel
            </button>
          </Card>

          <Card className="export-card">
            <div className="export-icon pdf">
              <FileText size={32} />
            </div>
            <h3>Export as PDF</h3>
            <p>Download a department-grouped PDF report of the ordered recommendation lists.</p>
            <button className="btn btn-primary btn-sm" onClick={(event) => handleDownloadClick(event, downloadPdf)}>
              <Download size={16} /> Download PDF
            </button>
          </Card>
        </div>
      </section>

      <section className="large-panel">
        <h3 className="panel-title">Export Information</h3>
        <Card className="info-card">
          <div className="info-content">
            <p><strong>Total Records:</strong> {items.length} recommendations</p>
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </Card>
      </section>
    </div>
  );
}

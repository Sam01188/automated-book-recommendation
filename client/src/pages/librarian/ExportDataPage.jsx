import { Download, FileText, Table } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { Card } from "../../components/librarian/Card";

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

function buildWorksheetData(items) {
  return items.map((item) => ({
    Rank: item.priorityRank || "",
    Title: item.title || "",
    Author: item.author || "",
    ISBN: item.isbn || "",
    Publisher: item.publisher || "",
    "Publisher Place": item.publisherPlace || "",
    Edition: item.edition || "",
    Binding: item.binding || "",
    "Agree Latest/Cheapest": item.agreeLatest || "",
    "Publication Year": item.publicationYear || "",
    "No. of Pages": item.numberOfPages || "",
    "Submitted By": item.submittedBy?.name || "",
    Status: item.status || "",
    Copies: item.copies || "",
    Price: item.price ? `${item.currency || "LKR"} ${item.price}` : "",
    "Additional Notes": item.additionalNotes || ""
  }));
}

function sanitizeSheetName(name) {
  const cleaned = String(name)
    .replace(/[\\/?*\[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (cleaned || "Unassigned").slice(0, 31);
}

export function ExportDataPage({ items }) {
  const orderedItems = getOrderedItems(items);

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadExcel() {
    const workbook = XLSX.utils.book_new();

    const departments = orderedItems.reduce((grouped, item) => {
      const department = getDepartmentKey(item);
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push(item);
      return grouped;
    }, {});

    const summaryData = orderedItems.map((item) => ({
      Department: getDepartmentKey(item),
      ...buildWorksheetData([item])[0]
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "All Recommendations");

    Object.entries(departments).forEach(([department, departmentItems]) => {
      const worksheet = XLSX.utils.json_to_sheet(buildWorksheetData(departmentItems));
      XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(department));
    });

    const workbookArray = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(
      new Blob([workbookArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      `recommendations-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  }

  function downloadPdf() {
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 36;
    const top = 44;
    const lineHeight = 16;
    const maxWidth = pageWidth - margin * 2;

    pdf.setFontSize(16);
    pdf.text("HoD Submitted Recommendation Lists", margin, top);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, top + 20);

    let y = top + 44;
    let currentDepartment = "";

    orderedItems.forEach((item) => {
      const department = item.department || "Unassigned";
      if (department !== currentDepartment) {
        currentDepartment = department;
        if (y > pdf.internal.pageSize.getHeight() - 120) {
          pdf.addPage();
          y = top;
        }
        pdf.setFontSize(12);
        pdf.setFont(undefined, "bold");
        pdf.text(`Department: ${department}`, margin, y);
        pdf.setFont(undefined, "normal");
        y += 18;
      }

      const blockLines = [
        `Rank: ${item.priorityRank || "-"}`,
        `Title: ${item.title || "N/A"}`,
        `Author: ${item.author || "N/A"}`,
        `ISBN: ${item.isbn || "N/A"}`,
        `Publisher: ${item.publisher || "N/A"} (${item.publisherPlace || "N/A"})`,
        `Edition: ${item.edition || "N/A"}`,
        `Binding: ${item.binding || "N/A"} | Agree Latest: ${item.agreeLatest || "N/A"}`,
        `Year: ${item.publicationYear || "N/A"} | Pages: ${item.numberOfPages || "N/A"}`,
        `Copies: ${item.copies || "N/A"} | Price: ${item.price ? `${item.currency || "LKR"} ${item.price}` : "N/A"}`,
        `Submitted By: ${item.submittedBy?.name || "N/A"} | Status: ${item.status || "N/A"}`
      ];

      if (item.additionalNotes) {
        blockLines.push(`Notes: ${item.additionalNotes}`);
      }

      blockLines.forEach((line) => {
        const wrappedLines = pdf.splitTextToSize(line, maxWidth);
        wrappedLines.forEach((wrappedLine) => {
          if (y > pdf.internal.pageSize.getHeight() - 40) {
            pdf.addPage();
            y = top;
          }
          pdf.text(wrappedLine, margin, y);
          y += lineHeight;
        });
      });

      y += 8;
    });

    const pdfBlob = pdf.output("blob");
    downloadBlob(pdfBlob, `recommendations-${new Date().toISOString().split("T")[0]}.pdf`);
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
            <p>Download ranked HoD lists as an XLSX workbook compatible with Excel and spreadsheet applications.</p>
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

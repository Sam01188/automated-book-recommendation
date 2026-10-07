import { useMemo } from "react";
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

function getFinalDepartmentItems(items) {
  return getOrderedItems(
    items.filter((item) => item.status !== "rejected" && Number.isFinite(item.priorityRank))
  );
}

function buildWorksheetData(items) {
  return items.map((item) => ({
    Rank: item.priorityRank || "",
    Department: item.department || "Unassigned",
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

export function ExportDataPage({ items = [], isExportLocked = true, periods = [], selectedPeriod = null, onSelectedPeriodChange = () => {} }) {
  const sortedPeriods = useMemo(
    () =>
      [...periods].sort((a, b) => {
        const aDate = a?.endDate ? new Date(a.endDate).getTime() : 0;
        const bDate = b?.endDate ? new Date(b.endDate).getTime() : 0;
        return bDate - aDate;
      }),
    [periods]
  );

  const closedPeriods = useMemo(
    () => [...sortedPeriods].filter((period) => period.status === "closed"),
    [sortedPeriods]
  );

  const fallbackSelectedPeriod = closedPeriods[0]?._id || sortedPeriods[0]?._id || null;
  const effectiveSelectedPeriod = selectedPeriod || fallbackSelectedPeriod;
  const selectedPeriodData = sortedPeriods.find((period) => String(period._id) === String(effectiveSelectedPeriod)) || null;
  const isSelectedPeriodLocked =
    !selectedPeriodData || selectedPeriodData.status === "open" || selectedPeriodData.status === "hod_priority";
  const exportLocked = isExportLocked || isSelectedPeriodLocked;

  const finalDepartmentItems = useMemo(() => {
    const filteredItems = effectiveSelectedPeriod
      ? (items || []).filter((item) => {
          const itemPeriodId = item.orderPeriod?._id || item.orderPeriod;
          return itemPeriodId && String(itemPeriodId) === String(effectiveSelectedPeriod);
        })
      : items || [];

    return getFinalDepartmentItems(filteredItems);
  }, [items, effectiveSelectedPeriod]);

  function showBlockedMessage() {
    window.alert("The selected period is still active. Please wait until the period is closed before exporting data.");
  }

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

    const departments = finalDepartmentItems.reduce((grouped, item) => {
      const department = getDepartmentKey(item);
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push(item);
      return grouped;
    }, {});

    const summaryData = finalDepartmentItems.map((item) => ({
      Department: getDepartmentKey(item),
      ...buildWorksheetData([item])[0]
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "HoD Final List");

    Object.entries(departments).forEach(([department, departmentItems]) => {
      const worksheet = XLSX.utils.json_to_sheet(buildWorksheetData(departmentItems));
      XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(department));
    });

    const workbookArray = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(
      new Blob([workbookArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      `hod-final-list-${new Date().toISOString().split("T")[0]}.xlsx`
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
    pdf.text("HoD Final Recommendation List by Department", margin, top);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, top + 20);

    let y = top + 44;
    let currentDepartment = "";

    finalDepartmentItems.forEach((item) => {
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
    downloadBlob(pdfBlob, `hod-final-list-${new Date().toISOString().split("T")[0]}.pdf`);
  }

  function handleDownloadClick(event, download) {
    event.stopPropagation();
    if (exportLocked) {
      showBlockedMessage();
      return;
    }
    download();
  }

  return (
    <div className="dashboard-container">
      {exportLocked && (
        <section className="large-panel" style={{ borderColor: "rgba(239, 68, 68, 0.45)", background: "rgba(239, 68, 68, 0.04)" }}>
          <h3 className="panel-title" style={{ color: "var(--danger)" }}>Export Restricted</h3>
          <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            {selectedPeriodData && (selectedPeriodData.status === "open" || selectedPeriodData.status === "hod_priority")
              ? "The selected order period is still active. Please wait until it is closed before exporting data."
              : "Please choose a closed period before exporting data."}
          </div>
        </section>
      )}

      <section className="large-panel">
        <h3 className="panel-title">Export Data</h3>

        {sortedPeriods.length > 0 && (
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-end" }}>
            <select
              value={effectiveSelectedPeriod || ""}
              onChange={(event) => onSelectedPeriodChange(event.target.value)}
              className="table-input"
              style={{ minWidth: "260px" }}
            >
              {sortedPeriods.map((periodItem) => {
                const startDate = new Date(periodItem.startDate).toLocaleDateString("en-GB");
                const endDate = new Date(periodItem.endDate).toLocaleDateString("en-GB");
                const isCurrent = periodItem.status === "open" || periodItem.status === "hod_priority";
                return (
                  <option key={periodItem._id} value={periodItem._id}>
                    {`${startDate} - ${endDate}${isCurrent ? " (Current)" : ""}`}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="export-grid">
          <Card className="export-card">
            <div className="export-icon excel">
              <Table size={32} />
            </div>
            <h3>Export HoD Final List (Excel)</h3>
            <p>Download the department-wise final ranked list as an XLSX workbook with one sheet per department.</p>
            <button className="btn btn-primary btn-sm" disabled={exportLocked} onClick={(event) => handleDownloadClick(event, downloadExcel)}>
              <Download size={16} /> Download Excel
            </button>
          </Card>

          <Card className="export-card">
            <div className="export-icon pdf">
              <FileText size={32} />
            </div>
            <h3>Export HoD Final List (PDF)</h3>
            <p>Download the final department-wise recommendation summary as a grouped PDF report.</p>
            <button className="btn btn-primary btn-sm" disabled={exportLocked} onClick={(event) => handleDownloadClick(event, downloadPdf)}>
              <Download size={16} /> Download PDF
            </button>
          </Card>
        </div>
      </section>

      <section className="large-panel">
        <h3 className="panel-title">Export Summary</h3>
        <Card className="info-card">
          <div className="info-content">
            <p><strong>Period:</strong> {selectedPeriodData ? `${new Date(selectedPeriodData.startDate).toLocaleDateString("en-GB")} - ${new Date(selectedPeriodData.endDate).toLocaleDateString("en-GB")}` : "No period selected"}</p>
            <p><strong>Final HoD Records:</strong> {finalDepartmentItems.length} ranked recommendations</p>
            <p><strong>Departments Included:</strong> {new Set(finalDepartmentItems.map((item) => getDepartmentKey(item))).size}</p>
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </Card>
      </section>
    </div>
  );
}

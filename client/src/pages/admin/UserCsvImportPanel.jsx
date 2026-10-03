import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload } from "lucide-react";
import { getUsers } from "../../api";

const departments = ["DCEE", "DEIE", "DMME", "DMENA"];

function roleHasDepartment(role) {
  return role === "lecturer" || role === "hod";
}

function formatRole(role) {
  if (role === "hod") return "HoD";
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "-";
}

function normalizeCsvHeader(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function getCsvField(row, acceptedHeaders) {
  const entry = Object.entries(row).find(([header]) => acceptedHeaders.includes(normalizeCsvHeader(header)));
  return entry ? String(entry[1] ?? "").trim() : "";
}

export function UserCsvImportPanel({ token, onImportUsers }) {
  const fileRef = useRef(null);
  const [previewRows, setPreviewRows] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const validCount = (previewRows || []).filter((row) => row.errors.length === 0).length;
  const resultByRow = new Map((results || []).map((row) => [row.rowNumber, row]));

  async function handleFileChange(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setError("");
    setResults(null);

    try {
      if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Choose a CSV file.");
      if (file.size > 1024 * 1024) throw new Error("CSV files must be 1 MB or smaller.");

      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const records = worksheet ? XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }) : [];
      if (records.length === 0) throw new Error("The CSV has no user rows.");
      if (records.length > 200) throw new Error("Import up to 200 users per CSV.");

      const headers = Object.keys(records[0]).map(normalizeCsvHeader);
      const hasName = headers.some((header) => ["name", "full name"].includes(header));
      const hasEmail = headers.some((header) => ["email", "email address"].includes(header));
      const hasRole = headers.some((header) => ["role", "system role"].includes(header));
      if (!hasName || !hasEmail || !hasRole) {
        throw new Error("CSV must include Name, Email, and Role columns. Department is required for lecturers and HoDs.");
      }

      const users = await getUsers(token);
      const existingEmails = new Set(users.map((user) => user.email.toLowerCase()));
      const seenEmails = new Set();
      const rows = records.map((record, index) => {
        const name = getCsvField(record, ["name", "full name"]);
        const email = getCsvField(record, ["email", "email address"]).toLowerCase();
        const rawRole = getCsvField(record, ["role", "system role"]).toLowerCase();
        const role = rawRole === "hod" ? "hod" : rawRole;
        const rawDepartment = getCsvField(record, ["department", "dept"]).toUpperCase();
        const department = roleHasDepartment(role) ? rawDepartment : "";
        const errors = [];

        if (!name || name.length > 100) errors.push("Name is required and must be 100 characters or fewer.");
        if (!/^\S+@ruh\.ac\.lk$/i.test(email)) errors.push("Use a valid @ruh.ac.lk email address.");
        if (!["lecturer", "hod", "librarian", "admin"].includes(role)) errors.push("Role must be Lecturer, HoD, Librarian, or Admin.");
        if (roleHasDepartment(role) && !departments.includes(department)) errors.push("Select a valid department.");
        if (email && existingEmails.has(email)) errors.push("An account with this email already exists.");
        if (email && seenEmails.has(email)) errors.push("This email appears more than once in the CSV.");
        if (email) seenEmails.add(email);

        return { rowNumber: index + 2, name, email, role, department, errors };
      });

      setPreviewRows(rows);
    } catch (fileError) {
      setError(fileError.message || "Unable to read this CSV file.");
      setPreviewRows(null);
    }
  }

  function downloadTemplate() {
    const blob = new Blob(["\uFEFFName,Email,Role,Department\r\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user-import-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function submitImport() {
    const validRows = (previewRows || []).filter((row) => row.errors.length === 0);
    if (validRows.length === 0 || results) return;

    setImporting(true);
    setError("");
    try {
      const outcome = await onImportUsers(validRows.map(({ rowNumber, name, email, role, department }) => ({
        rowNumber, name, email, role, department
      })));
      setResults(outcome.results || []);
    } catch (importError) {
      setError(importError.message || "The CSV import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="bulk-import-preview user-csv-import-panel" aria-label="Import users from CSV">
      <div className="bulk-import-header">
        <div>
          <h2 className="panel-title">Import users from CSV</h2>
          <p className="text-muted">Use @ruh.ac.lk email addresses. Temporary passwords are emailed to created accounts.</p>
        </div>
        <div className="bulk-import-actions">
          <button type="button" className="secondary-button" onClick={downloadTemplate}>
            <Download size={16} /> Template
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} hidden aria-label="Choose user CSV file" />
          <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Choose CSV
          </button>
        </div>
      </div>

      {error && <p className="bulk-import-issue" role="alert">{error}</p>}

      {previewRows && (
        <>
          <div className="bulk-import-header">
            <p className="text-muted">
              {validCount} ready | {previewRows.length - validCount} need correction
              {results && ` | ${results.filter((row) => row.status === "created").length} created`}
            </p>
            <div className="bulk-import-actions">
              <button type="button" className="secondary-button" onClick={() => { setPreviewRows(null); setResults(null); }} disabled={importing}>
                Clear preview
              </button>
              <button type="button" className="primary-button" onClick={submitImport} disabled={importing || validCount === 0 || Boolean(results)}>
                {importing ? "Importing..." : `Import ${validCount} users`}
              </button>
            </div>
          </div>

          <div className="table-wrap bulk-import-table-wrap">
            <table>
              <thead>
                <tr><th>Row</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Result</th></tr>
              </thead>
              <tbody>
                {previewRows.map((row) => {
                  const result = resultByRow.get(row.rowNumber);
                  const message = result?.message || (row.errors.length ? row.errors.join(" ") : "Ready to import.");
                  const success = result?.status === "created" && result.emailSent;
                  const issue = row.errors.length > 0 || (result && result.status !== "created") || result?.emailSent === false;

                  return (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>{row.name || "-"}</td>
                      <td>{row.email || "-"}</td>
                      <td>{formatRole(row.role)}</td>
                      <td>{row.department || "-"}</td>
                      <td className={success ? "bulk-import-success" : issue ? "bulk-import-issue" : ""}>{message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
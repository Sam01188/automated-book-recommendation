import { Badge } from "./Badge";

export function DataTable({ columns, data, renderRow }) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                No records found
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row._id || idx}>{renderRow(row)}</tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

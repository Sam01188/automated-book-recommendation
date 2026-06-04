import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { DataTable } from "../../components/librarian/DataTable";
import { Badge } from "../../components/librarian/Badge";

export function AllRecommendationsPage({ items, filterPriority: initialFilterPriority = "all" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredItems = items.filter((item) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      item.title?.toLowerCase().includes(search) ||
      item.author?.toLowerCase().includes(search) ||
      item.isbn?.toLowerCase().includes(search);

    const matchesDepartment =
      filterDepartment === "all" || item.department === filterDepartment;

    const matchesPriority =
      filterPriority === "all" || item.priority === filterPriority;

    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesPriority &&
      matchesStatus
    );
  });

  const getStatusBadgeType = (status) => {
    const statusMap = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      under_review: "info",
    };
    return statusMap[status] || "default";
  };

  const getPriorityBadgeType = (priority) => {
    const priorityMap = {
      high: "danger",
      medium: "warning",
      low: "success",
      unassigned: "secondary",
    };
    return priorityMap[priority] || "default";
  };

  return (
    <div className="recommendations-page">
      <div className="page-header">
        <div>
          <h1>All Recommendations</h1>
          <p>Manage and review all book recommendations</p>
        </div>
      </div>

      <Card className="filters-card">
        <div className="filters-container">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, author or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-group">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Departments</option>
              <option value="DCEE">DCEE</option>
              <option value="DEIE">DEIE</option>
              <option value="MENA">MENA</option>
              <option value="DMME">DMME</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="unassigned">Unassigned</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="full-width">
        <DataTable
          columns={[
            { key: "title", label: "Title" },
            { key: "author", label: "Author" },
            { key: "isbn", label: "ISBN" },
            { key: "edition", label: "Edition" },
            { key: "year", label: "Year" },
            { key: "binding", label: "Binding" },
            { key: "copies", label: "Copies" },
            { key: "price", label: "Price (LKR)" },
            { key: "publisher", label: "Publisher" },
            { key: "priority", label: "Priority" },
            { key: "status", label: "Status" },
            { key: "department", label: "Department" },
            { key: "submitted", label: "Submitted By" },
          ]}
          data={filteredItems}
          renderRow={(item) => (
            <>
              <td><strong>{item.title}</strong></td>
              <td>{item.author}</td>
              <td>{item.isbn || "N/A"}</td>
              <td>{item.edition || "N/A"}</td>
              <td>{item.year || "N/A"}</td>
              <td>{item.binding || "N/A"}</td>
              <td>{item.copies ?? 0}</td>

              {/* ✅ Price formatted properly */}
              <td>
                {item.price
                  ? `Rs. ${Number(item.price).toLocaleString()}`
                  : "N/A"}
              </td>

              <td>{item.publisher}</td>

              <td>
                <Badge
                  label={item.priority || "Unassigned"}
                  type={getPriorityBadgeType(item.priority)}
                />
              </td>

              <td>
                <Badge
                  label={item.status}
                  type={getStatusBadgeType(item.status)}
                />
              </td>

              <td>{item.department}</td>
              <td className="text-muted">
                {item.submittedBy?.name || "N/A"}
              </td>
            </>
          )}
        />
      </Card>

      <div className="results-info">
        Showing {filteredItems.length} of {items.length} recommendations
      </div>
    </div>
  );
}
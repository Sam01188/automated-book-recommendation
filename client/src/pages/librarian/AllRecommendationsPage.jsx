import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Card } from "../../components/librarian/Card";
import { DataTable } from "../../components/librarian/DataTable";
import { Badge } from "../../components/librarian/Badge";
import { Button } from "../../components/librarian/Button";

export function AllRecommendationsPage({ items }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Extract unique faculties from items
  const uniqueFaculties = [...new Set(items.map(item => item.faculty).filter(Boolean))].sort();

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty = filterFaculty === "all" || item.faculty === filterFaculty;
    const matchesPriority = filterPriority === "all" || item.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFaculty && matchesPriority && matchesStatus;
  });

  const getStatusBadgeType = (status) => {
    const statusMap = {
      "pending": "warning",
      "approved": "success",
      "rejected": "danger",
      "under_review": "info"
    };
    return statusMap[status] || "default";
  };

  const getPriorityBadgeType = (priority) => {
    const priorityMap = {
      "high": "danger",
      "medium": "warning",
      "low": "success",
      "unassigned": "secondary"
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
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-group">
            <select
              value={filterFaculty}
              onChange={(e) => setFilterFaculty(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Faculties</option>
              {uniqueFaculties.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
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
            { key: "title", label: "Title", width: "18%" },
            { key: "author", label: "Author", width: "12%" },
            { key: "publisher", label: "Publisher", width: "12%" },
            { key: "faculty", label: "Faculty", width: "12%" },
            { key: "priority", label: "Priority", width: "10%" },
            { key: "status", label: "Status", width: "10%" },
            { key: "department", label: "Department", width: "11%" },
            { key: "submitted", label: "Submitted By", width: "15%" }
          ]}
          data={filteredItems}
          renderRow={(item) => (
            <>
              <td>
                <strong>{item.title}</strong>
              </td>
              <td>{item.author}</td>
              <td>{item.publisher}</td>
              <td><strong>{item.faculty || "N/A"}</strong></td>
              <td>
                <Badge label={item.priority || "Unassigned"} type={getPriorityBadgeType(item.priority)} />
              </td>
              <td>
                <Badge label={item.status} type={getStatusBadgeType(item.status)} />
              </td>
              <td>{item.department}</td>
              <td className="text-muted">{item.submittedBy?.name || "N/A"}</td>
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

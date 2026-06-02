import { useEffect, useState } from "react";
import { getUsers, deleteUser, updateUser } from "../../api";
import { Trash2, Pencil, Save, X, UserCog, ChevronUp, ChevronDown } from "lucide-react";
import { AppModal } from "../../components/AppModal";

const departments = ["DCEE", "DEIE", "DMME", "DMENA", "DCE"];

function formatRole(role) {
  if (role === "hod") return "HoD";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function roleHasDepartment(role) {
  return role === "lecturer" || role === "hod";
}

function SortHeader({ label, column, sortConfig, onSort }) {
  const isActive = sortConfig.column === column;
  const directionLabel = sortConfig.direction === "asc" ? "ascending" : "descending";

  return (
    <button className="sort-header" type="button" onClick={() => onSort(column)} aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      <span className={isActive ? "sort-indicator active" : "sort-indicator"}>
        {isActive ? (sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />) : <span style={{ width: 16, height: 16, display: "inline-block" }} />}
      </span>
      {isActive && <span className="sr-only">Sorted {directionLabel}</span>}
    </button>
  );
}

export function UsersListPage({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [modal, setModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ column: "name", direction: "asc" });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    department: ""
  });

  useEffect(() => {
    loadUsers();
  }, [token]);

  async function loadUsers() {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getUsers(token);
      setUsers(data);
    } catch {
      setModal({
        title: "Failed to load users",
        message: "Please refresh the page or try again later."
      });
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(user) {
    setModal({
      title: "Delete this user?",
      message: `${user.name} will be removed from the system.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: () => confirmDelete(user._id)
    });
  }

  async function confirmDelete(id) {
    try {
      setModal(null);
      await deleteUser(token, id);
      setUsers((current) => current.filter((u) => u._id !== id));
    } catch {
      setModal({
        title: "Failed to delete user",
        message: "Please try again later."
      });
    }
  }

  function startEdit(user) {
    setEditingUserId(user._id);

    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "DCEE"
    });
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditForm({ name: "", email: "", role: "", department: "" });
  }

  function handleSort(column) {
    setSortConfig((current) => ({
      column,
      direction: current.column === column && current.direction === "asc" ? "desc" : "asc"
    }));
  }

  async function saveEdit(id) {
    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      department: roleHasDepartment(editForm.role) ? editForm.department.trim() : ""
    };

    try {
      setSaving(true);
      const updated = await updateUser(token, id, payload);

      setUsers((current) => current.map((u) => (u._id === id ? updated : u)));

      cancelEdit();
    } catch {
      setModal({
        title: "Failed to update user",
        message: "Please check the changes and try again."
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="empty-state">Loading users...</div>;
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesSearch = normalizedSearch
      ? [user.name, user.email, user.role, user.department]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch))
      : true;
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    const matchesDepartment = departmentFilter ? user.department === departmentFilter : true;

    return matchesSearch && matchesRole && matchesDepartment;
  });
  const sortedUsers = [...filteredUsers].sort((first, second) => {
    const firstValue = String(first[sortConfig.column] || "").toLowerCase();
    const secondValue = String(second[sortConfig.column] || "").toLowerCase();

    if (firstValue < secondValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }

    if (firstValue > secondValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }

    return 0;
  });

  return (
    <div className="large-panel">
      <div className="panel-toolbar">
        <h2 className="panel-title">
          System Users
        </h2>

        <div className="user-filters">
          <div className="search-field">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users..."
              aria-label="Search users"
            />
          </div>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role">
            <option value="">All Roles</option>
            <option value="lecturer">Lecturer</option>
            <option value="hod">HoD</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Admin</option>
          </select>

          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} aria-label="Filter by department">
            <option value="">All Departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <SortHeader label="Name" column="name" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              <th>
                <SortHeader label="Email" column="email" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              <th>
                <SortHeader label="Role" column="role" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              <th>
                <SortHeader label="Department" column="department" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  {searchQuery ? "No matching users found." : "No users found."}
                </td>
              </tr>
            )}

            {sortedUsers.map((u) => (
              <tr key={u._id}>
                <td>
                  {editingUserId === u._id ? (
                    <input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          name: e.target.value
                        })
                      }
                    />
                  ) : (
                    u.name
                  )}
                </td>

                <td>
                  {editingUserId === u._id ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          email: e.target.value
                        })
                      }
                    />
                  ) : (
                    u.email
                  )}
                </td>

                <td>
                  {editingUserId === u._id ? (
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          role: e.target.value,
                          department: roleHasDepartment(e.target.value) ? editForm.department || "DCEE" : ""
                        })
                      }
                    >
                      <option value="lecturer">Lecturer</option>
                      <option value="hod">HoD</option>
                      <option value="librarian">Librarian</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    formatRole(u.role)
                  )}
                </td>

                <td>
                  {editingUserId === u._id && roleHasDepartment(editForm.role) ? (
                    <select
                      value={editForm.department}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          department: e.target.value
                        })
                      }
                    >
                      {departments.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  ) : editingUserId === u._id ? (
                    "-"
                  ) : (
                    u.department || "-"
                  )}
                </td>

                <td style={{ textAlign: "center" }}>
                  {editingUserId === u._id ? (
                    <>
                      <button
                        className="secondary-button"
                        onClick={() => saveEdit(u._id)}
                        disabled={saving}
                      >
                        <Save size={16} />
                      </button>

                      <button
                        className="secondary-button"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="secondary-button"
                        onClick={() => startEdit(u)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() => handleDelete(u)}
                        style={{ color: "red" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <AppModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          variant={modal.variant}
          onConfirm={modal.onConfirm || (() => setModal(null))}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

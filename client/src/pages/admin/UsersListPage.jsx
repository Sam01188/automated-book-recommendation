import { useEffect, useState } from "react";
import { getUsers, deleteUser, updateUser, bulkUpdateUsers } from "../../api";
import { Trash2, Pencil, Save, X, ChevronUp, ChevronDown, RotateCcw, Download, UserCheck, UserX, UserCog } from "lucide-react";
import { AppModal } from "../../components/AppModal";

const departments = ["DCEE","DEIE","DMME","DMENA"];

function formatRole(role) {
  if (role === "hod") return "HoD";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function roleHasDepartment(role) {
  return role === "lecturer" || role === "hod";
}

function escapeCsvCell(value) {
  let text = String(value ?? "");
  if (/^[\t\r ]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
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
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkRole, setBulkRole] = useState("");
  const [bulkDepartment, setBulkDepartment] = useState("DCEE");
  const [bulkSaving, setBulkSaving] = useState(false);

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
      setSelectedUserIds([]);
    } catch {
      setModal({
        title: "Failed to load users",
        message: "Please refresh the page or try again later."
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserActive(user) {
    try {
      const nextStatus = !user.isActive;
      const updatedUser = await updateUser(token, user._id, { isActive: nextStatus });
      setUsers((current) => current.map((item) => (item._id === user._id ? { ...item, ...updatedUser, isActive: nextStatus } : item)));
      setModal({
        title: nextStatus ? "User activated" : "User deactivated",
        message: `${user.name} has been ${nextStatus ? "activated" : "deactivated"}.`
      });
    } catch {
      setModal({
        title: "Failed to update user status",
        message: "Please try again later."
      });
    }
  }

  function handleToggleUserActive(user) {
    if (user.isActive === false) {
      toggleUserActive(user);
      return;
    }

    setModal({
      title: "Deactivate this user?",
      message: `${user.name} will no longer be able to sign in.`,
      confirmText: "Deactivate",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: async () => {
        setModal(null);
        await toggleUserActive(user);
      }
    });
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
      const deletedUser = users.find(u => u._id === id);
      await deleteUser(token, id);

      setUsers((current) => current.filter((u) => u._id !== id));
      setSelectedUserIds((current) => current.filter((userId) => userId !== String(id)));
      setModal({
        title: "User deleted",
        message: `${deletedUser?.name || "User"} was deleted successfully.`
      });
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
      await updateUser(token, id, payload);

      // Update the user with the edited form data to ensure visibility
      setUsers((current) =>
        current.map((u) =>
          u._id === id
            ? {
                ...u,
                name: payload.name,
                email: payload.email,
                role: payload.role,
                department: payload.department
              }
            : u
        )
      );

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

  function toggleVisibleUsers(checked, visibleUsers) {
    const visibleIds = visibleUsers.map((user) => String(user._id));
    setSelectedUserIds((current) => {
      if (checked) return [...new Set([...current, ...visibleIds])];
      const visibleIdSet = new Set(visibleIds);
      return current.filter((id) => !visibleIdSet.has(id));
    });
  }

  async function applyBulkAction(action) {
    setBulkSaving(true);
    try {
      const response = await bulkUpdateUsers(token, {
        userIds: selectedUserIds,
        action,
        ...(action === "role" ? { role: bulkRole, department: bulkDepartment } : {})
      });
      const updatedById = new Map(response.users.map((user) => [String(user._id), user]));
      setUsers((current) => current.map((user) => updatedById.get(String(user._id)) || user));
      setSelectedUserIds([]);
      setBulkRole("");
      setModal({
        title: "Bulk update complete",
        message: `${response.updatedCount} user${response.updatedCount === 1 ? "" : "s"} updated.`
      });
    } catch (error) {
      setModal({
        title: "Bulk update failed",
        message: error.message || "Please check the selection and try again."
      });
    } finally {
      setBulkSaving(false);
    }
  }

  function requestBulkAction(action) {
    if (action === "deactivate") {
      setModal({
        title: "Deactivate selected users?",
        message: `${selectedUserIds.length} selected account(s) will no longer be able to sign in.`,
        confirmText: "Deactivate",
        cancelText: "Cancel",
        variant: "danger",
        onConfirm: async () => {
          setModal(null);
          await applyBulkAction(action);
        }
      });
      return;
    }

    applyBulkAction(action);
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
  const selectedUsers = users.filter((user) => selectedUserIds.includes(String(user._id)));
  const allVisibleSelected = sortedUsers.length > 0 && sortedUsers.every((user) => selectedUserIds.includes(String(user._id)));

  function exportUsers(exportList = sortedUsers, filenamePrefix = "users") {
    const rows = [
      ["Name", "Email", "Role", "Department", "Status"],
      ...exportList.map((user) => [
        user.name,
        user.email,
        formatRole(user.role),
        user.department || "",
        user.isActive === false ? "Inactive" : "Active"
      ])
    ];
    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

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

          <select value={roleFilter} onChange={(event) => {
            setRoleFilter(event.target.value);
            // Clear department filter if librarian or admin is selected
            if (event.target.value === "librarian" || event.target.value === "admin") {
              setDepartmentFilter("");
            }
          }} aria-label="Filter by role">
            <option value="">All Roles</option>
            <option value="lecturer">Lecturer</option>
            <option value="hod">HoD</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Admin</option>
          </select>

          <select 
            value={departmentFilter} 
            onChange={(event) => setDepartmentFilter(event.target.value)} 
            aria-label="Filter by department"
            disabled={roleFilter === "librarian" || roleFilter === "admin"}
          >
            <option value="">All Departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="secondary-button user-filter-icon-button"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("");
              setDepartmentFilter("");
            }}
            aria-label="Reset filters"
            title="Reset all filters"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className="secondary-button user-filter-icon-button"
            onClick={exportUsers}
            disabled={sortedUsers.length === 0}
            aria-label="Export filtered users as CSV"
            title="Export filtered users as CSV"
          >
            <Download size={16} />
          </button>

        </div>
      </div>

      {selectedUserIds.length > 0 && (
        <div className="bulk-user-toolbar" aria-label="Bulk user actions">
          <strong className="bulk-selection-count">{selectedUserIds.length} selected</strong>
          <button type="button" className="secondary-button bulk-action-button" onClick={() => requestBulkAction("activate")} disabled={bulkSaving}>
            <UserCheck size={16} /> Activate
          </button>
          <button type="button" className="secondary-button bulk-action-button" onClick={() => requestBulkAction("deactivate")} disabled={bulkSaving}>
            <UserX size={16} /> Deactivate
          </button>
          <select className="bulk-role-select" value={bulkRole} onChange={(event) => setBulkRole(event.target.value)} aria-label="Role to assign to selected users" disabled={bulkSaving}>
            <option value="">Assign role...</option>
            <option value="lecturer">Lecturer</option>
            <option value="hod">HoD</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Admin</option>
          </select>
          {roleHasDepartment(bulkRole) && (
            <select className="bulk-role-select" value={bulkDepartment} onChange={(event) => setBulkDepartment(event.target.value)} aria-label="Department to assign to selected users" disabled={bulkSaving}>
              {departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          )}
          <button type="button" className="primary-button bulk-action-button" onClick={() => requestBulkAction("role")} disabled={bulkSaving || !bulkRole}>
            <UserCog size={16} /> Apply role
          </button>
          <button type="button" className="secondary-button bulk-action-button" onClick={() => exportUsers(selectedUsers, "selected-users")} disabled={selectedUsers.length === 0}>
            <Download size={16} /> Export selected
          </button>
          <button type="button" className="secondary-button bulk-clear-button" onClick={() => setSelectedUserIds([])} disabled={bulkSaving} aria-label="Clear selection" title="Clear selection">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) => toggleVisibleUsers(event.target.checked, sortedUsers)}
                  aria-label="Select all visible users"
                />
              </th>
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
              <th>
                <SortHeader label="Status" column="isActive" sortConfig={sortConfig} onSort={handleSort} />
              </th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  {searchQuery ? "No matching users found." : "No users found."}
                </td>
              </tr>
            )}

            {sortedUsers.map((u) => (
              <tr key={u._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(String(u._id))}
                    onChange={(event) => toggleVisibleUsers(event.target.checked, [u])}
                    aria-label={`Select ${u.name}`}
                    disabled={bulkSaving}
                  />
                </td>
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

                <td>
                  <div className="user-status-control">
                    <span className={u.isActive === false ? "badge badge-secondary" : "badge badge-success"}>
                      {u.isActive === false ? "Inactive" : "Active"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={u.isActive !== false}
                      aria-label={`${u.isActive === false ? "Activate" : "Deactivate"} ${u.name} account`}
                      title={u.isActive === false ? "Activate user" : "Deactivate user"}
                      className="user-status-switch"
                      onClick={() => handleToggleUserActive(u)}
                    >
                      <span className="user-status-switch-thumb" />
                    </button>
                  </div>
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
                        title="Edit user"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() => handleDelete(u)}
                        style={{ color: "red" }}
                        title="Delete user"
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

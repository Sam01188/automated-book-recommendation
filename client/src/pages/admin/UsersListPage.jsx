import { useEffect, useState } from "react";
import { getUsers, deleteUser } from "../../api";
import { Trash2, UserCog } from "lucide-react";

export function UsersListPage({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getUsers(token);
      setUsers(data);
    } catch (err) {
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(token, id);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert("Failed to delete user");
    }
  }

  if (loading) return <div className="empty-state">Loading system users...</div>;

  return (
    <div className="large-panel">
      <h2 className="panel-title">
        <UserCog size={24} className="text-primary" />
        System Users
      </h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`priority ${u.role}`}>{u.role}</span></td>
                <td>{u.department || "-"}</td>
                <td style={{ textAlign: 'center' }}>
                  <button className="secondary-button" onClick={() => handleDelete(u._id)} style={{ padding: '0.5rem', color: '#ef4444' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

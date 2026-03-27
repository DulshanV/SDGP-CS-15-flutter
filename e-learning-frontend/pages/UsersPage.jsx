import { useEffect, useState } from "react";
import api, { formatError } from "../services/api";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get("/users");
        setUsers(response.data);
      } catch (requestError) {
        setError(formatError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (loading) {
    return <div className="center-panel">Loading users...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Users</p>
            <h2>Platform user directory</h2>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Enrollments</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status-badge ${user.role}`}>{user.role}</span>
                    </td>
                    <td>{user.enrollments}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-empty">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default UsersPage;

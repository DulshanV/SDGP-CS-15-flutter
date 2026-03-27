import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import api, { formatError } from "../services/api";

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/dashboard/admin");
        setDashboard(response.data);
      } catch (requestError) {
        setError(formatError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="center-panel">Loading admin dashboard...</div>;
  }

  return (
    <div className="page-stack">
      {error ? <div className="alert error">{error}</div> : null}

      <section className="stats-grid">
        <StatCard label="Students" value={dashboard?.summary.students || 0} />
        <StatCard label="Admins" value={dashboard?.summary.admins || 0} />
        <StatCard label="Courses" value={dashboard?.summary.courses || 0} tone="success" />
        <StatCard
          label="Pending Enrollments"
          value={dashboard?.summary.pendingEnrollments || 0}
          tone="warn"
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Operations</p>
            <h2>Recent enrollment activity</h2>
          </div>
          <Link to="/admin/enrollments" className="secondary-button">
            Review Requests
          </Link>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Status</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.recentEnrollments?.length ? (
                dashboard.recentEnrollments.map((item) => (
                  <tr key={item.id}>
                    <td>{item.student_name}</td>
                    <td>{item.course_title}</td>
                    <td>
                      <span className={`status-badge ${item.status}`}>{item.status}</span>
                    </td>
                    <td>{new Date(item.requested_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="table-empty">
                    No enrollment activity yet.
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

export default AdminDashboardPage;

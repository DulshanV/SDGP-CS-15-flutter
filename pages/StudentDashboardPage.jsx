import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";
import api, { formatError } from "../services/api";

function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/dashboard/student");
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
    return <div className="center-panel">Loading dashboard...</div>;
  }

  return (
    <div className="page-stack">
      {error ? <div className="alert error">{error}</div> : null}

      <section className="stats-grid">
        <StatCard label="Enrollment Requests" value={dashboard?.summary.totalRequests || 0} />
        <StatCard label="Pending Approvals" value={dashboard?.summary.pendingRequests || 0} tone="warn" />
        <StatCard label="Active Courses" value={dashboard?.summary.activeCourses || 0} tone="success" />
        <StatCard label="Certificates" value={dashboard?.summary.certificates || 0} tone="accent" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">My Learning</p>
            <h2>Course progress overview</h2>
          </div>
          <Link to="/courses" className="secondary-button">
            Browse More Courses
          </Link>
        </div>

        <div className="stack-list">
          {dashboard?.courses?.length ? (
            dashboard.courses.map((course) => (
              <article key={course.id} className="list-card">
                <div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <span className={`status-badge ${course.status}`}>{course.status}</span>
                </div>
                <div className="list-card-side">
                  <ProgressBar value={course.progress?.percentage || 0} label="Completion" />
                  <Link to={`/courses/${course.course_id}`} className="primary-button inline-action">
                    Open Course
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-panel">No enrollments yet. Browse the course catalog to get started.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default StudentDashboardPage;

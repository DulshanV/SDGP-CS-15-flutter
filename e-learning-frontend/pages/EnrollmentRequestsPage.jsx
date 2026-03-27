import { useEffect, useState } from "react";
import api, { formatError } from "../services/api";

function EnrollmentRequestsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadEnrollments = async () => {
    try {
      const response = await api.get("/enrollments");
      setEnrollments(response.data);
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/enrollments/${id}`, { status });
      await loadEnrollments();
    } catch (requestError) {
      setError(formatError(requestError));
    }
  };

  if (loading) {
    return <div className="center-panel">Loading enrollment requests...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Enrollment Requests</p>
            <h2>Approve or reject student access</h2>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length ? (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>{enrollment.student_name}</td>
                    <td>{enrollment.student_email}</td>
                    <td>{enrollment.course_title}</td>
                    <td>
                      <span className={`status-badge ${enrollment.status}`}>{enrollment.status}</span>
                    </td>
                    <td>
                      {enrollment.status === "pending" ? (
                        <div className="table-actions">
                          <button
                            type="button"
                            className="text-button success"
                            onClick={() => updateStatus(enrollment.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="text-button danger"
                            onClick={() => updateStatus(enrollment.id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="helper-text">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-empty">
                    No requests found.
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

export default EnrollmentRequestsPage;

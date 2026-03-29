import { useEffect, useState } from "react";
import api, { formatError } from "../services/api";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, coursesRes] = await Promise.all([
          api.get("/users"),
          api.get("/courses")
        ]);
        setUsers(usersRes.data);
        setCourses(coursesRes.data);
      } catch (requestError) {
        setError(formatError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const openAssignModal = (user) => {
    setAssignTarget(user);
    setSelectedCourse("");
    setAssignError("");
    setAssignSuccess("");
  };

  const closeAssignModal = () => {
    setAssignTarget(null);
    setSelectedCourse("");
    setAssignError("");
    setAssignSuccess("");
  };

  const handleAssign = async () => {
    if (!selectedCourse) {
      setAssignError("Please select a course to assign.");
      return;
    }

    setAssigning(true);
    setAssignError("");
    setAssignSuccess("");

    try {
      await api.post(`/users/${assignTarget.id}/enroll`, { courseId: Number(selectedCourse) });
      setAssignSuccess(`Module successfully assigned to ${assignTarget.name}.`);
      const usersRes = await api.get("/users");
      setUsers(usersRes.data);
    } catch (requestError) {
      setAssignError(formatError(requestError));
    } finally {
      setAssigning(false);
    }
  };

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
                <th>Actions</th>
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
                    <td>
                      {user.role === "student" ? (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => openAssignModal(user)}
                        >
                          Assign Module
                        </button>
                      ) : (
                        <span className="helper-text">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="table-empty">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {assignTarget ? (
        <div className="modal-overlay">
          <div className="modal-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Assign Module</p>
                <h2>{assignTarget.name}</h2>
              </div>
              <button type="button" className="secondary-button" onClick={closeAssignModal}>
                Cancel
              </button>
            </div>

            {assignError ? <div className="alert error">{assignError}</div> : null}
            {assignSuccess ? <div className="alert success">{assignSuccess}</div> : null}

            {!assignSuccess ? (
              <div className="form-stack">
                <label className="field-label" htmlFor="course-select">
                  Select Course
                </label>
                <select
                  id="course-select"
                  className="text-input"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">— choose a course —</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleAssign}
                  disabled={assigning}
                >
                  {assigning ? "Assigning…" : "Assign Module"}
                </button>
              </div>
            ) : (
              <button type="button" className="secondary-button" onClick={closeAssignModal}>
                Close
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default UsersPage;

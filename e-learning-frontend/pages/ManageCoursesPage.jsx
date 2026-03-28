import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { formatError } from "../services/api";

function ManageCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data);
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const deleteCourse = async (courseId) => {
    const confirmed = window.confirm("Delete this course and all related content?");
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/courses/${courseId}`);
      await loadCourses();
    } catch (requestError) {
      setError(formatError(requestError));
    }
  };

  if (loading) {
    return <div className="center-panel">Loading course management...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Course Management</p>
            <h2>Create and maintain training courses</h2>
          </div>
          <Link to="/admin/courses/new" className="primary-button">
            Add Course
          </Link>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Lessons</th>
                <th>Quizzes</th>
                <th>Enrolled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length ? (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.lessons_count}</td>
                    <td>{course.quizzes_count}</td>
                    <td>{course.enrolled_students}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/admin/courses/${course.id}/edit`} className="text-button">
                          Edit
                        </Link>
                        <Link to={`/admin/courses/${course.id}/lessons`} className="text-button">
                          Lessons
                        </Link>
                        <Link to={`/admin/courses/${course.id}/quizzes`} className="text-button">
                          Quizzes
                        </Link>
                        <button
                          type="button"
                          className="text-button danger"
                          onClick={() => deleteCourse(course.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-empty">
                    No courses created yet.
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

export default ManageCoursesPage;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import api, { formatError } from "../services/api";

function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyCourses = async () => {
      try {
        const response = await api.get("/enrollments/me");
        setCourses(response.data);
      } catch (requestError) {
        setError(formatError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadMyCourses();
  }, []);

  if (loading) {
    return <div className="center-panel">Loading your courses...</div>;
  }

  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">My Courses</p>
        <h2>Track every enrollment and completion</h2>
      </section>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="stack-list">
        {courses.length ? (
          courses.map((course) => (
            <article key={course.id} className="list-card">
              <div>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <span className={`status-badge ${course.status}`}>{course.status}</span>
              </div>
              <div className="list-card-side">
                <ProgressBar value={course.progress?.percentage || 0} label="Progress" />
                <Link to={`/courses/${course.course_id}`} className="primary-button inline-action">
                  View Course
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-panel">No course requests yet.</div>
        )}
      </div>
    </div>
  );
}

export default MyCoursesPage;

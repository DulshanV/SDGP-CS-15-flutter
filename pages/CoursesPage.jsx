import { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard";
import api, { formatError } from "../services/api";

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

    loadCourses();
  }, []);

  if (loading) {
    return <div className="center-panel">Loading courses...</div>;
  }

  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Course Catalog</p>
        <h2>Available training programs</h2>
        <p>Browse all customs training courses currently available on the platform.</p>
      </section>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="card-grid">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </section>
    </div>
  );
}

export default CoursesPage;

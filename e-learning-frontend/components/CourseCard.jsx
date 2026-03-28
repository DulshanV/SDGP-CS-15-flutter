import { Link } from "react-router-dom";

function CourseCard({ course, actionLabel = "View Details", actionTo }) {
  return (
    <article className="course-card">
      <div className="course-card-top">
        <span className="badge">Customs Training</span>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
      </div>
      <div className="course-meta">
        <span>{course.lessons_count || 0} lessons</span>
        <span>{course.quizzes_count || 0} quizzes</span>
        {course.enrolled_students !== undefined ? <span>{course.enrolled_students} enrolled</span> : null}
      </div>
      <Link className="primary-button inline-action" to={actionTo || `/courses/${course.id}`}>
        {actionLabel}
      </Link>
    </article>
  );
}

export default CourseCard;

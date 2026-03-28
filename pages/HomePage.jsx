import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Sri Lankan Customs Training</p>
          <h1>Build customs knowledge with structured online courses, quizzes, and certification.</h1>
          <p className="lead">
            A full e-learning platform for students and administrators to manage approvals,
            track learning progress, and issue completion certificates.
          </p>
          <div className="hero-actions">
            <Link to="/courses" className="primary-button">
              Explore Courses
            </Link>
            <Link to="/register" className="secondary-button create-account-button">
              Create Account
            </Link>
          </div>
        </div>
        <div className="hero-card-grid">
          <article className="spotlight-card">
            <h3>Enrollment Approval</h3>
            <p>Students request access and admins approve only the right learners.</p>
          </article>
          <article className="spotlight-card">
            <h3>Video + Quiz Learning</h3>
            <p>Every course can include lesson videos and MCQ checks for understanding.</p>
          </article>
          <article className="spotlight-card">
            <h3>Completion Certificates</h3>
            <p>Generate downloadable PDF certificates automatically on course completion.</p>
          </article>
        </div>
      </section>

      <section className="feature-strip">
        <article className="feature-panel">
          <h3>For Students</h3>
          <p>Browse courses, request enrollment, study approved content, and track progress.</p>
        </article>
        <article className="feature-panel">
          <h3>For Admins</h3>
          <p>Create training programs, add lessons and quizzes, and manage the entire workflow.</p>
        </article>
        <article className="feature-panel">
          <h3>For Compliance</h3>
          <p>Keep clear completion records and issue certificates that can be downloaded anytime.</p>
        </article>
      </section>
    </div>
  );
}

export default HomePage;

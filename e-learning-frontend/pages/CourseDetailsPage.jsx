import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import { useAuth } from "../context/AuthContext";
import api, { formatError, resolveFileUrl } from "../services/api";

function getVideoEmbed(videoUrl) {
  if (!videoUrl) {
    return { type: "link", url: "" };
  }

  if (videoUrl.includes("youtube.com/watch?v=")) {
    return {
      type: "iframe",
      url: videoUrl.replace("watch?v=", "embed/")
    };
  }

  if (videoUrl.includes("youtu.be/")) {
    const videoId = videoUrl.split("youtu.be/")[1];
    return {
      type: "iframe",
      url: `https://www.youtube.com/embed/${videoId}`
    };
  }

  if (/\.(mp4|webm|ogg)$/i.test(videoUrl)) {
    return {
      type: "video",
      url: videoUrl
    };
  }

  return {
    type: "iframe",
    url: videoUrl
  };
}

function CourseDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");

  const currentVideo = getVideoEmbed(selectedLesson?.video_url);

  const syncSelectedLesson = (newLessons) => {
    const preferredLesson = newLessons.find((lesson) => lesson.id === selectedLesson?.id);
    setSelectedLesson(preferredLesson || newLessons[0] || null);
  };

  const loadCourse = async () => {
    const response = await api.get(`/courses/${id}`);
    setCourse(response.data);
  };

  const loadStudentData = async () => {
    if (!user || user.role !== "student") {
      return;
    }

    const enrollmentsResponse = await api.get("/enrollments/me");
    const currentEnrollment = enrollmentsResponse.data.find(
      (item) => String(item.course_id) === String(id)
    );
    setEnrollment(currentEnrollment || null);

    if (currentEnrollment && ["approved", "completed"].includes(currentEnrollment.status)) {
      const [lessonsResponse, quizzesResponse, progressResponse] = await Promise.all([
        api.get(`/lessons/${id}`),
        api.get(`/quizzes/${id}`),
        api.get(`/progress/${id}`)
      ]);
      setLessons(lessonsResponse.data);
      syncSelectedLesson(lessonsResponse.data);
      setQuizzes(quizzesResponse.data);
      setProgress(progressResponse.data);
    } else {
      setLessons([]);
      setQuizzes([]);
      setProgress(null);
      setSelectedLesson(null);
    }
  };

  const loadAdminData = async () => {
    if (!user || user.role !== "admin") {
      return;
    }

    const [lessonsResponse, quizzesResponse] = await Promise.all([
      api.get(`/lessons/${id}`),
      api.get(`/quizzes/${id}`)
    ]);

    setLessons(lessonsResponse.data);
    syncSelectedLesson(lessonsResponse.data);
    setQuizzes(quizzesResponse.data);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        await loadCourse();

        if (user?.role === "student") {
          await loadStudentData();
        }

        if (user?.role === "admin") {
          await loadAdminData();
        }
      } catch (requestError) {
        setError(formatError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user?.id, user?.role]);

  const refreshProgress = async () => {
    if (user?.role !== "student") {
      return;
    }

    const [enrollmentsResponse, lessonsResponse, quizzesResponse, progressResponse] = await Promise.all([
      api.get("/enrollments/me"),
      api.get(`/lessons/${id}`),
      api.get(`/quizzes/${id}`),
      api.get(`/progress/${id}`)
    ]);

    const currentEnrollment = enrollmentsResponse.data.find(
      (item) => String(item.course_id) === String(id)
    );

    setEnrollment(currentEnrollment || null);
    setLessons(lessonsResponse.data);
    syncSelectedLesson(lessonsResponse.data);
    setQuizzes(quizzesResponse.data);
    setProgress(progressResponse.data);
  };

  const requestEnrollment = async () => {
    try {
      setBusyAction("enroll");
      setError("");
      await api.post("/enroll", { courseId: Number(id) });
      await loadStudentData();
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setBusyAction("");
    }
  };

  const markLessonComplete = async (lessonId) => {
    try {
      setBusyAction(`lesson-${lessonId}`);
      await api.put(`/lessons/${lessonId}/progress`, { isCompleted: true });
      await refreshProgress();
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setBusyAction("");
    }
  };

  const submitQuizAnswer = async (quizId, selectedAnswer) => {
    try {
      setBusyAction(`quiz-${quizId}`);
      await api.post("/quizzes/submit", { quizId, selectedAnswer });
      await refreshProgress();
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setBusyAction("");
    }
  };

  const generateCertificate = async () => {
    try {
      setBusyAction("certificate");
      await api.post("/certificates", { courseId: Number(id) });
      await refreshProgress();
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setBusyAction("");
    }
  };

  if (loading) {
    return <div className="center-panel">Loading course...</div>;
  }

  return (
    <div className="page-stack">
      {error ? <div className="alert error">{error}</div> : null}

      <section className="detail-hero">
        <div>
          <p className="eyebrow">Course Details</p>
          <h2>{course?.title}</h2>
          <p className="lead">{course?.description}</p>
          <div className="detail-meta">
            <span>{course?.lessons_count || 0} lessons</span>
            <span>{course?.quizzes_count || 0} quizzes</span>
            <span>Created by {course?.creator_name}</span>
          </div>
        </div>

        {user?.role === "student" ? (
          <div className="action-panel">
            <p className="eyebrow">Enrollment Status</p>
            <h3>{enrollment?.status || "not requested"}</h3>
            <p>
              {enrollment
                ? "Your request and course progress appear here."
                : "Request enrollment to unlock the course content after admin approval."}
            </p>
            {!enrollment ? (
              <button
                type="button"
                className="primary-button"
                onClick={requestEnrollment}
                disabled={busyAction === "enroll"}
              >
                {busyAction === "enroll" ? "Sending..." : "Request Enrollment"}
              </button>
            ) : null}
            {progress ? <ProgressBar value={progress.percentage || 0} label="Completion" /> : null}
          </div>
        ) : null}

        {user?.role === "admin" ? (
          <div className="action-panel">
            <p className="eyebrow">Admin Actions</p>
            <h3>Manage this course</h3>
            <div className="button-row">
              <Link to={`/admin/courses/${id}/lessons`} className="secondary-button">
                Lessons
              </Link>
              <Link to={`/admin/courses/${id}/quizzes`} className="secondary-button">
                Quizzes
              </Link>
              <Link to={`/admin/courses/${id}/edit`} className="primary-button">
                Edit Course
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {!user ? (
        <div className="empty-panel">
          Login as a student to request enrollment, or sign in as an admin to manage this course.
        </div>
      ) : null}

      {user?.role === "student" && enrollment && !["approved", "completed"].includes(enrollment.status) ? (
        <div className="empty-panel">
          Your enrollment is currently <strong>{enrollment.status}</strong>. Lessons and quizzes will unlock
          after approval.
        </div>
      ) : null}

      {(user?.role === "admin" || (user?.role === "student" && ["approved", "completed"].includes(enrollment?.status))) ? (
        <div className="detail-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Lesson Player</p>
                <h3>{selectedLesson?.title || "No lesson selected"}</h3>
              </div>
            </div>

            {selectedLesson ? (
              <div className="video-frame">
                {currentVideo.type === "iframe" ? (
                  <iframe
                    title={selectedLesson.title}
                    src={currentVideo.url}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : null}

                {currentVideo.type === "video" ? (
                  <video controls src={resolveFileUrl(currentVideo.url)} />
                ) : null}

                {currentVideo.type === "link" ? (
                  <a href={selectedLesson.video_url} target="_blank" rel="noreferrer">
                    Open lesson video
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="empty-panel">No lessons have been added yet.</div>
            )}

            {user?.role === "student" && selectedLesson ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => markLessonComplete(selectedLesson.id)}
                disabled={busyAction === `lesson-${selectedLesson.id}` || selectedLesson.is_completed}
              >
                {selectedLesson.is_completed
                  ? "Lesson Completed"
                  : busyAction === `lesson-${selectedLesson.id}`
                    ? "Saving..."
                    : "Mark as Watched"}
              </button>
            ) : null}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Lessons</p>
                <h3>Course content</h3>
              </div>
            </div>
            <div className="stack-list">
              {lessons.length ? (
                lessons.map((lesson) => (
                  <button
                    type="button"
                    key={lesson.id}
                    className={`lesson-item ${selectedLesson?.id === lesson.id ? "active" : ""}`}
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <span>{lesson.position}. {lesson.title}</span>
                    {user?.role === "student" && lesson.is_completed ? <strong>Done</strong> : null}
                  </button>
                ))
              ) : (
                <div className="empty-panel">No lessons have been added.</div>
              )}
            </div>
          </section>

          <section className="panel detail-wide">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Quiz Section</p>
                <h3>Answer each question to complete the course</h3>
              </div>
            </div>

            <div className="quiz-list">
              {quizzes.length ? (
                quizzes.map((quiz, index) => (
                  <article key={quiz.id} className="quiz-card">
                    <div>
                      <span className="badge">Question {index + 1}</span>
                      <h4>{quiz.question}</h4>
                    </div>

                    <div className="option-grid">
                      {["A", "B", "C", "D"].map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={`option-button ${quiz.selected_answer === option ? "selected" : ""}`}
                          onClick={() => submitQuizAnswer(quiz.id, option)}
                          disabled={user?.role === "admin" || busyAction === `quiz-${quiz.id}`}
                        >
                          <strong>{option}.</strong>{" "}
                          {quiz[`option_${option.toLowerCase()}`]}
                        </button>
                      ))}
                    </div>

                    {user?.role === "student" ? (
                      <p className="helper-text">
                        {quiz.selected_answer
                          ? quiz.is_correct
                            ? "You answered this correctly."
                            : "Submitted, but not yet correct. Try again."
                          : "Select an answer to submit."}
                      </p>
                    ) : (
                      <p className="helper-text">Correct answer: {quiz.correct_answer}</p>
                    )}
                  </article>
                ))
              ) : (
                <div className="empty-panel">No quizzes have been added.</div>
              )}
            </div>

            {user?.role === "student" && enrollment?.status === "completed" ? (
              <button
                type="button"
                className="primary-button"
                onClick={generateCertificate}
                disabled={busyAction === "certificate"}
              >
                {busyAction === "certificate" ? "Generating..." : "Generate Certificate"}
              </button>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default CourseDetailsPage;

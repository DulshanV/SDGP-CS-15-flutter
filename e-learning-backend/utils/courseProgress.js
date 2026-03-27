const { query } = require("../db");
const { ensureCertificateRecord } = require("./certificateGenerator");

async function calculateCourseProgress(userId, courseId) {
  const [lessonStats] = await query(
    `SELECT
        COUNT(*) AS total_lessons,
        COALESCE(SUM(CASE WHEN lp.is_completed = 1 THEN 1 ELSE 0 END), 0) AS completed_lessons
     FROM Lessons l
     LEFT JOIN LessonProgress lp
       ON lp.lesson_id = l.id
      AND lp.user_id = ?
     WHERE l.course_id = ?`,
    [userId, courseId]
  );

  const [quizStats] = await query(
    `SELECT
        COUNT(*) AS total_quizzes,
        COALESCE(SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END), 0) AS passed_quizzes
     FROM Quizzes q
     LEFT JOIN QuizAttempts qa
       ON qa.quiz_id = q.id
      AND qa.user_id = ?
     WHERE q.course_id = ?`,
    [userId, courseId]
  );

  const totalLessons = Number(lessonStats.total_lessons || 0);
  const completedLessons = Number(lessonStats.completed_lessons || 0);
  const totalQuizzes = Number(quizStats.total_quizzes || 0);
  const passedQuizzes = Number(quizStats.passed_quizzes || 0);
  const totalItems = totalLessons + totalQuizzes;
  const completedItems = completedLessons + passedQuizzes;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const isCompleted =
    totalItems > 0 &&
    completedLessons === totalLessons &&
    passedQuizzes === totalQuizzes;

  return {
    totalLessons,
    completedLessons,
    totalQuizzes,
    passedQuizzes,
    percentage,
    isCompleted
  };
}

async function syncCourseCompletion(userId, courseId) {
  const progress = await calculateCourseProgress(userId, courseId);

  if (progress.isCompleted) {
    await query(
      `UPDATE Enrollments
       SET status = 'completed'
       WHERE user_id = ? AND course_id = ? AND status IN ('approved', 'completed')`,
      [userId, courseId]
    );

    const certificate = await ensureCertificateRecord(userId, courseId);
    return { ...progress, certificate };
  }

  return progress;
}

async function getCourseAccess(user, courseId) {
  if (user.role === "admin") {
    return { allowed: true, status: "admin" };
  }

  const enrollments = await query(
    "SELECT status FROM Enrollments WHERE user_id = ? AND course_id = ?",
    [user.id, courseId]
  );

  if (enrollments.length === 0 || !["approved", "completed"].includes(enrollments[0].status)) {
    return { allowed: false, status: enrollments[0]?.status || "none" };
  }

  return { allowed: true, status: enrollments[0].status };
}

module.exports = {
  calculateCourseProgress,
  syncCourseCompletion,
  getCourseAccess
};

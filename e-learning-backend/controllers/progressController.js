const db = require("../db.js");
const courseProgress = require("../utils/courseProgress.js");

const { query } = db;
const { calculateCourseProgress, getCourseAccess } = courseProgress;

async function getCourseProgressDetails(req, res, next) {
  try {
    const { courseId } = req.params;
    const access = await getCourseAccess(req.user, courseId);
    const targetUserId =
      req.user.role === "admin" && req.query.userId ? Number(req.query.userId) : req.user.id;

    if (!access.allowed) {
      return res.status(403).json({ message: "You do not have access to this course progress." });
    }

    const progress = await calculateCourseProgress(targetUserId, courseId);
    const completedLessons = await query(
      `SELECT lp.lesson_id
       FROM LessonProgress lp
       INNER JOIN Lessons l ON l.id = lp.lesson_id
       WHERE lp.user_id = ? AND l.course_id = ? AND lp.is_completed = 1`,
      [targetUserId, courseId]
    );
    const answeredQuizzes = await query(
      `SELECT qa.quiz_id, qa.selected_answer, qa.is_correct
       FROM QuizAttempts qa
       INNER JOIN Quizzes q ON q.id = qa.quiz_id
       WHERE qa.user_id = ? AND q.course_id = ?`,
      [targetUserId, courseId]
    );

    return res.json({
      ...progress,
      completedLessonIds: completedLessons.map((item) => item.lesson_id),
      quizAttempts: answeredQuizzes
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCourseProgressDetails
};


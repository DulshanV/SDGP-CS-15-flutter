const db = require("../db.js");
const courseProgress = require("../utils/courseProgress.js");

const { query } = db;
const { getCourseAccess, syncCourseCompletion } = courseProgress;

async function createLesson(req, res, next) {
  try {
    const { courseId, title, videoUrl, position = 1 } = req.body;

    if (!courseId || !title || !videoUrl) {
      return res.status(400).json({ message: "Course ID, title, and video URL are required." });
    }

    const course = await query("SELECT id FROM Courses WHERE id = ?", [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: "Course not found." });
    }

    const result = await query(
      "INSERT INTO Lessons (course_id, title, video_url, position) VALUES (?, ?, ?, ?)",
      [courseId, title, videoUrl, position]
    );

    const [lesson] = await query("SELECT * FROM Lessons WHERE id = ?", [result.insertId]);
    return res.status(201).json(lesson);
  } catch (error) {
    return next(error);
  }
}

async function getLessons(req, res, next) {
  try {
    const { courseId } = req.params;
    const access = await getCourseAccess(req.user, courseId);

    if (!access.allowed) {
      return res.status(403).json({ message: "You do not have access to this course content yet." });
    }

    const lessons = await query(
      `SELECT
          l.id,
          l.course_id,
          l.title,
          l.video_url,
          l.position,
          CASE WHEN lp.is_completed = 1 THEN 1 ELSE 0 END AS is_completed,
          lp.completed_at
       FROM Lessons l
       LEFT JOIN LessonProgress lp
         ON lp.lesson_id = l.id
        AND lp.user_id = ?
       WHERE l.course_id = ?
       ORDER BY l.position ASC, l.created_at ASC`,
      [req.user.id, courseId]
    );

    return res.json(lessons);
  } catch (error) {
    return next(error);
  }
}

async function updateLesson(req, res, next) {
  try {
    const { id } = req.params;
    const { title, videoUrl, position = 1 } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ message: "Title and video URL are required." });
    }

    const existing = await query("SELECT id FROM Lessons WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    await query(
      "UPDATE Lessons SET title = ?, video_url = ?, position = ? WHERE id = ?",
      [title, videoUrl, position, id]
    );

    const [updated] = await query("SELECT * FROM Lessons WHERE id = ?", [id]);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

async function deleteLesson(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await query("SELECT id FROM Lessons WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    await query("DELETE FROM Lessons WHERE id = ?", [id]);
    return res.json({ message: "Lesson deleted successfully." });
  } catch (error) {
    return next(error);
  }
}

async function updateLessonProgress(req, res, next) {
  try {
    const { lessonId } = req.params;
    const { isCompleted = true } = req.body;

    const lessons = await query("SELECT id, course_id FROM Lessons WHERE id = ?", [lessonId]);
    if (lessons.length === 0) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const lesson = lessons[0];
    const access = await getCourseAccess(req.user, lesson.course_id);
    if (!access.allowed) {
      return res.status(403).json({ message: "You cannot update progress for this course." });
    }

    await query(
      `INSERT INTO LessonProgress (user_id, lesson_id, is_completed, completed_at)
       VALUES (?, ?, ?, CASE WHEN ? THEN NOW() ELSE NULL END)
       ON DUPLICATE KEY UPDATE
         is_completed = VALUES(is_completed),
         completed_at = CASE WHEN VALUES(is_completed) = 1 THEN NOW() ELSE NULL END`,
      [req.user.id, lessonId, isCompleted ? 1 : 0, isCompleted ? 1 : 0]
    );

    const progress = await syncCourseCompletion(req.user.id, lesson.course_id);
    return res.json({
      message: "Lesson progress updated.",
      progress
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createLesson,
  getLessons,
  updateLesson,
  deleteLesson,
  updateLessonProgress
};


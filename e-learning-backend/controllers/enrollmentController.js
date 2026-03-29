const db = require("../db.js");
const courseProgress = require("../utils/courseProgress.js");

const { query } = db;
const { calculateCourseProgress } = courseProgress;

async function requestEnrollment(req, res, next) {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required." });
    }

    const course = await query("SELECT id FROM Courses WHERE id = ?", [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: "Course not found." });
    }

    const existing = await query(
      "SELECT id, status FROM Enrollments WHERE user_id = ? AND course_id = ?",
      [req.user.id, courseId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: `Enrollment already exists with status: ${existing[0].status}.`
      });
    }

    const result = await query(
      "INSERT INTO Enrollments (user_id, course_id, status) VALUES (?, ?, 'pending')",
      [req.user.id, courseId]
    );

    const [enrollment] = await query("SELECT * FROM Enrollments WHERE id = ?", [result.insertId]);
    return res.status(201).json(enrollment);
  } catch (error) {
    return next(error);
  }
}

async function getEnrollments(req, res, next) {
  try {
    const enrollments = await query(
      `SELECT
          e.id,
          e.status,
          e.requested_at,
          e.approved_at,
          u.id AS user_id,
          u.name AS student_name,
          u.email AS student_email,
          c.id AS course_id,
          c.title AS course_title
       FROM Enrollments e
       INNER JOIN Users u ON u.id = e.user_id
       INNER JOIN Courses c ON c.id = e.course_id
       ORDER BY FIELD(e.status, 'pending', 'approved', 'completed', 'rejected'), e.requested_at DESC`
    );

    return res.json(enrollments);
  } catch (error) {
    return next(error);
  }
}

async function updateEnrollment(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected." });
    }

    const enrollments = await query("SELECT * FROM Enrollments WHERE id = ?", [id]);
    if (enrollments.length === 0) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    await query(
      `UPDATE Enrollments
       SET status = ?, approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE NULL END
       WHERE id = ?`,
      [status, status, id]
    );

    const [updated] = await query("SELECT * FROM Enrollments WHERE id = ?", [id]);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

async function getMyEnrollments(req, res, next) {
  try {
    const enrollments = await query(
      `SELECT
          e.id,
          e.status,
          e.requested_at,
          e.approved_at,
          c.id AS course_id,
          c.title,
          c.description
       FROM Enrollments e
       INNER JOIN Courses c ON c.id = e.course_id
       WHERE e.user_id = ?
       ORDER BY e.requested_at DESC`,
      [req.user.id]
    );

    const progressData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await calculateCourseProgress(req.user.id, enrollment.course_id);
        return {
          ...enrollment,
          progress
        };
      })
    );

    return res.json(progressData);
  } catch (error) {
    return next(error);
  }
}

async function assignEnrollment(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const courseId = parseInt(req.body.courseId, 10);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({ message: "Course ID is required and must be a positive integer." });
    }

    const user = await query("SELECT id FROM Users WHERE id = ?", [userId]);
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const course = await query("SELECT id FROM Courses WHERE id = ?", [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: "Course not found." });
    }

    const existing = await query(
      "SELECT id, status FROM Enrollments WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: `User is already enrolled with status: ${existing[0].status}.`
      });
    }

    const result = await query(
      "INSERT INTO Enrollments (user_id, course_id, status, approved_at) VALUES (?, ?, 'approved', NOW())",
      [userId, courseId]
    );

    const [enrollment] = await query("SELECT * FROM Enrollments WHERE id = ?", [result.insertId]);
    return res.status(201).json(enrollment);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requestEnrollment,
  getEnrollments,
  updateEnrollment,
  getMyEnrollments,
  assignEnrollment
};


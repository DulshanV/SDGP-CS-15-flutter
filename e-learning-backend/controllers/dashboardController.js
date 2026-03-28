const db = require("../db.js");
const courseProgress = require("../utils/courseProgress.js");

const { query } = db;
const { calculateCourseProgress } = courseProgress;

async function getAdminDashboard(req, res, next) {
  try {
    const [userCounts] = await query(
      `SELECT
          SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) AS students,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
       FROM Users`
    );

    const [courseCounts] = await query(
      `SELECT
          COUNT(DISTINCT c.id) AS courses,
          SUM(CASE WHEN e.status = 'pending' THEN 1 ELSE 0 END) AS pending_enrollments,
          SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed_enrollments
       FROM Courses c
       LEFT JOIN Enrollments e ON e.course_id = c.id`
    );

    const recentEnrollments = await query(
      `SELECT
          e.id,
          e.status,
          u.name AS student_name,
          c.title AS course_title,
          e.requested_at
       FROM Enrollments e
       INNER JOIN Users u ON u.id = e.user_id
       INNER JOIN Courses c ON c.id = e.course_id
       ORDER BY e.requested_at DESC
       LIMIT 5`
    );

    return res.json({
      summary: {
        students: Number(userCounts.students || 0),
        admins: Number(userCounts.admins || 0),
        courses: Number(courseCounts.courses || 0),
        pendingEnrollments: Number(courseCounts.pending_enrollments || 0),
        completedEnrollments: Number(courseCounts.completed_enrollments || 0)
      },
      recentEnrollments
    });
  } catch (error) {
    return next(error);
  }
}

async function getStudentDashboard(req, res, next) {
  try {
    const enrollments = await query(
      `SELECT
          e.id,
          e.status,
          c.id AS course_id,
          c.title,
          c.description
       FROM Enrollments e
       INNER JOIN Courses c ON c.id = e.course_id
       WHERE e.user_id = ?
       ORDER BY e.requested_at DESC`,
      [req.user.id]
    );

    const courses = await Promise.all(
      enrollments.map(async (enrollment) => ({
        ...enrollment,
        progress: await calculateCourseProgress(req.user.id, enrollment.course_id)
      }))
    );

    const certificates = await query(
      "SELECT COUNT(*) AS total FROM Certificates WHERE user_id = ?",
      [req.user.id]
    );

    const pendingRequests = courses.filter((course) => course.status === "pending").length;
    const activeCourses = courses.filter((course) =>
      ["approved", "completed"].includes(course.status)
    ).length;
    const completedCourses = courses.filter((course) => course.status === "completed").length;

    return res.json({
      summary: {
        totalRequests: courses.length,
        pendingRequests,
        activeCourses,
        completedCourses,
        certificates: Number(certificates[0].total || 0)
      },
      courses
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAdminDashboard,
  getStudentDashboard
};

